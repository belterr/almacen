import { NextRequest, NextResponse } from "next/server";
import type { VerificarStockRequest } from "@/types/api";

// Esta API hace de proxy para llamar al intermediario externo
// Evita problemas de CORS al hacer la llamada desde el servidor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as VerificarStockRequest;
    const { orderId, products } = body;

    console.log("📞 [NOSOTROS → INTERMEDIARIO] Enviando solicitud de verificación de stock");
    console.log("Order ID:", orderId);
    console.log("Productos:", products);

    // URL del intermediario externo (configurada en .env.local)
    const INTERMEDIARIO_URL = process.env.NEXT_PUBLIC_INTERMEDIARIO_URL;

    if (!INTERMEDIARIO_URL || INTERMEDIARIO_URL === "https://tu-intermediario.com/api/verificar-stock") {
      console.error("❌ URL del intermediario no configurada");
      return NextResponse.json(
        {
          success: false,
          message: "URL del intermediario no configurada. Configura NEXT_PUBLIC_INTERMEDIARIO_URL en .env.local",
        },
        { status: 500 }
      );
    }

    // El intermediario espera un solo producto por llamada
    // Si hay múltiples productos, hacemos múltiples llamadas
    const responses = [];
    
    for (const product of products) {
      const intermediarioPayload = {
        product_id: product.externalId, // Usar el ID externo del intermediario
        quantity: product.quantity,
      };

      console.log("📤 Payload enviado al intermediario:", JSON.stringify(intermediarioPayload, null, 2));

      const response = await fetch(INTERMEDIARIO_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(intermediarioPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error del intermediario:", response.status, errorText);
        throw new Error(`Error del intermediario: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Respuesta del intermediario:", result);
      responses.push(result);
    }

    return NextResponse.json({
      success: true,
      message: "Solicitud enviada al intermediario correctamente",
      data: responses,
    });
  } catch (error) {
    console.error("❌ Error al llamar al intermediario:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Error al contactar al intermediario",
      },
      { status: 500 }
    );
  }
}
