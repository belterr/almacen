import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import type { AlmacenWebhookRequest } from "@/types/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Configurar CORS para permitir que el almacén nos llame
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // En producción, especifica el dominio del almacén
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Manejar preflight request (OPTIONS)
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Esta API recibe la respuesta del almacén cuando verifica el stock
// El almacén llama a esta API después de que el intermediario le consulta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AlmacenWebhookRequest;
    const { orderId, sessionId, hasStock, products, message } = body;

    console.log("✅ [ALMACÉN → NOSOTROS] Respuesta recibida del almacén");
    console.log("Order ID:", orderId);
    console.log("Session ID:", sessionId);
    console.log("Tiene stock:", hasStock);
    console.log("Productos:", products);

    // Actualizar estado de la orden en Convex
    const status = hasStock ? "confirmed" : "rejected";
    
    await convex.mutation(api.orders.updateOrderStatus, {
      orderId: orderId,
      status: status,
    });

    console.log(`✅ Orden ${orderId} actualizada a estado: ${status}`);

    if (hasStock) {
      // El almacén confirmó que SÍ hay stock
      return NextResponse.json({
        success: true,
        message: "Confirmación de stock recibida correctamente",
        data: {
          orderId,
          sessionId,
          status: "confirmed",
          receivedAt: new Date().toISOString(),
        },
      }, { headers: corsHeaders });
    } else {
      // El almacén confirmó que NO hay stock
      return NextResponse.json({
        success: true,
        message: "Notificación de falta de stock recibida",
        data: {
          orderId,
          sessionId,
          status: "rejected",
          reason: message || "Stock insuficiente",
          receivedAt: new Date().toISOString(),
        },
      }, { headers: corsHeaders });
    }
  } catch (error) {
    console.error("❌ Error al recibir respuesta del almacén:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error al procesar la respuesta del almacén",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
