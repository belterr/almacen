// import { NextRequest, NextResponse } from "next/server";
// import { ConvexHttpClient } from "convex/browser";
// import { api } from "../../../../../convex/_generated/api";
// import type { AlmacenWebhookRequest } from "@/types/api";

// const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// // Configurar CORS para permitir que el almacén nos llame
// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*", // En producción, especifica el dominio del almacén
//   "Access-Control-Allow-Methods": "POST, OPTIONS",
//   "Access-Control-Allow-Headers": "Content-Type, Authorization",
// };

// // Manejar preflight request (OPTIONS)
// export async function OPTIONS() {
//   return NextResponse.json({}, { headers: corsHeaders });
// }

// // Esta API recibe la respuesta del almacén cuando verifica el stock
// // El almacén llama a esta API después de que el intermediario le consulta
// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json() as AlmacenWebhookRequest;
//     const { orderId, sessionId, hasStock, products, message } = body;

//     console.log("✅ [ALMACÉN → NOSOTROS] Respuesta recibida del almacén");
//     console.log("Order ID:", orderId);
//     console.log("Session ID:", sessionId);
//     console.log("Tiene stock:", hasStock);
//     console.log("Productos:", products);

//     // Actualizar estado de la orden en Convex
//     const status = hasStock ? "confirmed" : "rejected";
    
//     await convex.mutation(api.orders.updateOrderStatus, {
//       orderId: orderId,
//       status: status,
//     });

//     console.log(`✅ Orden ${orderId} actualizada a estado: ${status}`);

//     if (hasStock) {
//       // El almacén confirmó que SÍ hay stock
//       return NextResponse.json({
//         success: true,
//         message: "Confirmación de stock recibida correctamente",
//         data: {
//           orderId,
//           sessionId,
//           status: "confirmed",
//           receivedAt: new Date().toISOString(),
//         },
//       }, { headers: corsHeaders });
//     } else {
//       // El almacén confirmó que NO hay stock
//       return NextResponse.json({
//         success: true,
//         message: "Notificación de falta de stock recibida",
//         data: {
//           orderId,
//           sessionId,
//           status: "rejected",
//           reason: message || "Stock insuficiente",
//           receivedAt: new Date().toISOString(),
//         },
//       }, { headers: corsHeaders });
//     }
//   } catch (error) {
//     console.error("❌ Error al recibir respuesta del almacén:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         message: "Error al procesar la respuesta del almacén",
//       },
//       { status: 500, headers: corsHeaders }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import type { AlmacenWebhookRequest } from "@/types/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    
    console.log("✅ [WEBHOOK] Request recibido");
    console.log("✅ [WEBHOOK] Body completo:", JSON.stringify(rawBody, null, 2));
    
    let webhookData: AlmacenWebhookRequest;
    
    // Detectar si viene de EventBridge o llamada HTTP directa
    // EventBridge puede enviar detail-type (con guión) o detailType (camelCase)
    const detailType = rawBody["detail-type"] || rawBody.detailType;
    const source = rawBody.source;
    
    if (rawBody.detail || detailType || source) {
      // Es un evento de EventBridge
      console.log("✅ [WEBHOOK] Procesando evento de EventBridge");
      console.log("✅ [WEBHOOK] Source:", source);
      console.log("✅ [WEBHOOK] DetailType (rawBody.detailType):", rawBody.detailType);
      console.log("✅ [WEBHOOK] DetailType (rawBody['detail-type']):", rawBody["detail-type"]);
      console.log("✅ [WEBHOOK] DetailType (final):", detailType);
      
      // EventBridge puede enviar detail como string o objeto
      const detail = typeof rawBody.detail === 'string' 
        ? JSON.parse(rawBody.detail) 
        : rawBody.detail;
      
      console.log("✅ [WEBHOOK] Detail parseado:", JSON.stringify(detail, null, 2));
      
      // Convertir formato de Lambda al formato esperado por el webhook
      const orderId = detail.order_id || detail.orderId;
      const sessionId = detail.session_id || detail.sessionId;
      const productId = detail.product_id || detail.productId;
      const quantity = detail.quantity;
      const stockActual = detail.stock_actual || detail.stockActual;
      const message = detail.message || "Procesado";
      
      // Determinar hasStock - PRIORIDAD: detail.hasStock > detailType > mensaje
      let hasStock = false;
      
      console.log("🔍 [WEBHOOK] Determinando hasStock...");
      console.log("🔍 [WEBHOOK] - detail.hasStock:", detail.hasStock, "(tipo:", typeof detail.hasStock, ")");
      console.log("🔍 [WEBHOOK] - detailType:", detailType);
      console.log("🔍 [WEBHOOK] - message:", message);
      
      // 1. Si viene hasStock directamente en el detail, usarlo
      if (typeof detail.hasStock === 'boolean') {
        hasStock = detail.hasStock;
        console.log("✅ [WEBHOOK] hasStock desde detail.hasStock:", hasStock);
      }
      // 2. Si no, usar detailType
      else if (detailType) {
        // Verificar si es "stock.true", "stock.fail" o "stock.false"
        const detailTypeStr = String(detailType).toLowerCase();
        
        console.log("🔍 [WEBHOOK] DetailType normalizado:", detailTypeStr);
        
        // Detectar si es true o false/fail
        if (detailTypeStr === "stock.true" || detailTypeStr.includes("true")) {
          hasStock = true;
          console.log("✅ [WEBHOOK] hasStock = true porque detailType es stock.true");
        } else if (detailTypeStr === "stock.fail" || detailTypeStr === "stock.false" || 
                   detailTypeStr.includes("fail") || detailTypeStr.includes("false")) {
          hasStock = false;
          console.log("✅ [WEBHOOK] hasStock = false porque detailType es", detailType);
        } else {
          // Por defecto, si no se reconoce, asumir false
          hasStock = false;
          console.log("⚠️ [WEBHOOK] DetailType no reconocido, asumiendo hasStock = false");
        }
        
        console.log("✅ [WEBHOOK] hasStock determinado desde detailType:", hasStock, "(detailType:", detailType, ", normalizado:", detailTypeStr, ")");
      }
      // 3. Si no hay detailType, inferir del mensaje
      else {
        const msgLower = String(message).toLowerCase();
        hasStock = !msgLower.includes("insuficiente") && 
                   !msgLower.includes("error") &&
                   !msgLower.includes("fail") &&
                   !msgLower.includes("no encontrado") &&
                   !msgLower.includes("insufficient");
        console.log("✅ [WEBHOOK] hasStock inferido del mensaje:", hasStock, "(mensaje:", message, ")");
      }
      
      // Construir el array de products
      const products = productId ? [{
        productId: productId.toString(),
        quantity: quantity,
        availableStock: stockActual,
        status: hasStock ? "updated" : "insufficient_stock"
      }] : [];
      
      // Crear mensaje específico cuando no hay stock suficiente
      let finalMessage = message;
      if (!hasStock && stockActual !== undefined && quantity !== undefined) {
        finalMessage = `No se cumplen con las piezas solicitadas. Solicitado: ${quantity}, Disponible: ${stockActual}`;
        console.log("✅ [WEBHOOK] Mensaje personalizado para stock insuficiente:", finalMessage);
      }
      
      webhookData = {
        orderId: orderId,
        sessionId: sessionId,
        hasStock: hasStock,
        products: products,
        message: finalMessage
      };
      
      console.log("✅ [WEBHOOK] Datos convertidos:", JSON.stringify(webhookData, null, 2));
      console.log("✅ [WEBHOOK] hasStock final:", hasStock);
      
    } else {
      // Es una llamada HTTP directa (formato original)
      console.log("✅ [WEBHOOK] Procesando llamada HTTP directa");
      webhookData = rawBody as AlmacenWebhookRequest;
    }
    
    const { orderId, sessionId, hasStock, products, message } = webhookData;

    // Validar datos requeridos
    if (!orderId || !sessionId) {
      console.error("❌ [WEBHOOK] Faltan datos requeridos:", { orderId, sessionId });
      return NextResponse.json(
        {
          success: false,
          message: "Faltan datos requeridos: orderId y sessionId",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log("✅ [ALMACÉN → NOSOTROS] Respuesta recibida del almacén");
    console.log("Order ID:", orderId);
    console.log("Session ID:", sessionId);
    console.log("Tiene stock:", hasStock, "(tipo:", typeof hasStock, ")");
    console.log("Productos:", products);

    // Actualizar estado de la orden en Convex
    const status = hasStock ? "confirmed" : "rejected";
    
    console.log("🔵 [WEBHOOK] Actualizando orden en Convex:");
    console.log("🔵 [WEBHOOK] - orderId:", orderId);
    console.log("🔵 [WEBHOOK] - status:", status);
    console.log("🔵 [WEBHOOK] - hasStock era:", hasStock);
    
    // Preparar datos para actualizar
    const updateData: {
      orderId: string;
      status: string;
      rejectionMessage?: string;
    } = {
      orderId: orderId,
      status: status,
    };
    
    // Si es rechazado, incluir el mensaje
    if (status === "rejected" && message) {
      updateData.rejectionMessage = message;
    }
    
    await convex.mutation(api.orders.updateOrderStatus, updateData);

    console.log(`✅ Orden ${orderId} actualizada a estado: ${status}`);

    if (hasStock) {
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
      // Mensaje más descriptivo cuando no hay stock
      const rejectionMessage = message || "Stock insuficiente";
      
      return NextResponse.json({
        success: true,
        message: "Notificación de falta de stock recibida",
        data: {
          orderId,
          sessionId,
          status: "rejected",
          reason: rejectionMessage,
          receivedAt: new Date().toISOString(),
        },
      }, { headers: corsHeaders });
    }
  } catch (error) {
    console.error("❌ [WEBHOOK] Error al recibir respuesta del almacén:", error);
    console.error("❌ [WEBHOOK] Stack:", error instanceof Error ? error.stack : "N/A");
    return NextResponse.json(
      {
        success: false,
        message: "Error al procesar la respuesta del almacén",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}