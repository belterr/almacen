// import { NextRequest, NextResponse } from "next/server";
// import type { VerificarStockRequest } from "@/types/api";

// // Esta API hace de proxy para llamar al intermediario externo
// // Evita problemas de CORS al hacer la llamada desde el servidor
// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json() as VerificarStockRequest;
//     const { orderId, products } = body;

//     console.log("📞 [NOSOTROS → INTERMEDIARIO] Enviando solicitud de verificación de stock");
//     console.log("Order ID:", orderId);
//     console.log("Productos:", products);

//     // URL del intermediario externo (configurada en .env.local)
//     const INTERMEDIARIO_URL = process.env.NEXT_PUBLIC_INTERMEDIARIO_URL;

//     if (!INTERMEDIARIO_URL || INTERMEDIARIO_URL === "https://tu-intermediario.com/api/verificar-stock") {
//       console.error("❌ URL del intermediario no configurada");
//       return NextResponse.json(
//         {
//           success: false,
//           message: "URL del intermediario no configurada. Configura NEXT_PUBLIC_INTERMEDIARIO_URL en .env.local",
//         },
//         { status: 500 }
//       );
//     }

//     // El intermediario espera un solo producto por llamada
//     // Si hay múltiples productos, hacemos múltiples llamadas
//     const responses = [];
    
//     for (const product of products) {
//       const intermediarioPayload = {
//         product_id: product.externalId, // Usar el ID externo del intermediario
//         quantity: product.quantity,
//         orderId: orderId,
//         sessionId: body.sessionId,
//       };

//       console.log("📤 Payload enviado al intermediario:", JSON.stringify(intermediarioPayload, null, 2));

//       const response = await fetch(INTERMEDIARIO_URL, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(intermediarioPayload),
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error("❌ Error del intermediario:", response.status, errorText);
//         throw new Error(`Error del intermediario: ${response.status}`);
//       }

//       const result = await response.json();
//       console.log("✅ Respuesta del intermediario:", result);
//       responses.push(result);
//     }

//     return NextResponse.json({
//       success: true,
//       message: "Solicitud enviada al intermediario correctamente",
//       data: responses,
//     });
//   } catch (error) {
//     console.error("❌ Error al llamar al intermediario:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         message: error instanceof Error ? error.message : "Error al contactar al intermediario",
//       },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import type { VerificarStockRequest } from "@/types/api";
import { EventBridgeClient, PutEventsCommand, type PutEventsRequestEntry, type PutEventsResultEntry } from "@aws-sdk/client-eventbridge";

// Cliente de EventBridge (se reutiliza entre requests)
const eventBridgeClient = new EventBridgeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined, // Si no hay credenciales, usará IAM role o variables de entorno del sistema
});

// Esta API envía eventos a EventBridge en lugar de hacer HTTP request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as VerificarStockRequest;
    const { orderId, products } = body;

    console.log("📞 [NOSOTROS → EVENTBRIDGE] Enviando evento de verificación de stock");
    console.log("Order ID:", orderId);
    console.log("Productos:", products);

    // Validar configuración de EventBridge
    const EVENT_BUS_NAME = process.env.AWS_EVENT_BUS_NAME;
    const SOURCE = process.env.AWS_EVENT_SOURCE || "local.app";

    if (!EVENT_BUS_NAME) {
      console.error("❌ Event Bus name no configurado");
      return NextResponse.json(
        {
          success: false,
          message: "Event Bus name no configurado. Configura AWS_EVENT_BUS_NAME en .env.local",
        },
        { status: 500 }
      );
    }

    // Preparar eventos para cada producto
    const events: PutEventsRequestEntry[] = products.map((product) => ({
      Source: SOURCE,
      DetailType: "order.created",
      Detail: JSON.stringify({
        product_id: product.externalId, // ID externo del intermediario
        quantity: product.quantity,
        orderId: orderId,
        sessionId: body.sessionId,
        totalAmount: body.totalAmount,
        webhookUrl: body.webhookUrl,
      }),
      EventBusName: EVENT_BUS_NAME,
    }));

    console.log("📤 Eventos a enviar a EventBridge:", JSON.stringify(events, null, 2));

    // Enviar eventos a EventBridge
    const command = new PutEventsCommand({
      Entries: events,
    });

    const response = await eventBridgeClient.send(command);
    // Después de la línea 141, agrega:
console.log("📊 Respuesta completa de EventBridge:", JSON.stringify(response, null, 2));
console.log("📊 Event IDs:", response.Entries?.map((e: PutEventsResultEntry) => e.EventId));
console.log("📊 Failed count:", response.FailedEntryCount);

    // Verificar si hubo errores
    if (response.FailedEntryCount && response.FailedEntryCount > 0) {
      console.error("❌ Algunos eventos fallaron:", response.Entries);
      const failedEntries = response.Entries?.filter((entry: PutEventsResultEntry) => entry.ErrorCode);
      throw new Error(
        `Error al enviar eventos: ${failedEntries?.map((e: PutEventsResultEntry) => e.ErrorMessage).join(", ")}`
      );
    }

    console.log("✅ Eventos enviados a EventBridge correctamente:", response.Entries?.length);

    return NextResponse.json({
      success: true,
      message: "Eventos enviados a EventBridge correctamente",
      data: {
        entriesCount: response.Entries?.length || 0,
        eventIds: response.Entries?.map((e: PutEventsResultEntry) => e.EventId),
      },
    });
  } catch (error) {
    console.error("❌ Error al enviar eventos a EventBridge:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Error al contactar con EventBridge",
      },
      { status: 500 }
    );
  }
}