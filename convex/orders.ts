import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Crear orden pendiente antes de llamar al intermediario
export const createPendingOrder = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Obtener items del carrito
    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    if (cartItems.length === 0) {
      throw new Error("El carrito está vacío");
    }

    // Obtener detalles de los productos
    const productsData = await Promise.all(
      cartItems.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        if (!product) {
          console.error(`❌ Producto no encontrado: ${item.productId}`);
          throw new Error(`Producto ${item.productId} no encontrado. Por favor, actualiza tu carrito.`);
        }
        if (!product.externalId) {
          console.error(`❌ Producto sin externalId: ${item.productId}`);
          throw new Error(`Producto ${product.name} no tiene ID externo configurado.`);
        }
        return {
          productId: item.productId,
          externalId: product.externalId, // ID que usa el intermediario
          quantity: item.quantity,
          price: product.price,
        };
      })
    );

    const totalAmount = productsData.reduce(
      (sum, p) => sum + p.price * p.quantity,
      0
    );

    // Generar ID de orden único
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Crear orden pendiente
    await ctx.db.insert("pendingOrders", {
      sessionId: args.sessionId,
      orderId: orderId,
      products: productsData,
      totalAmount: totalAmount,
      status: "pending",
      createdAt: Date.now(),
    });

    return {
      success: true,
      orderId: orderId,
      sessionId: args.sessionId,
      products: productsData,
      totalAmount: totalAmount,
    };
  },
});

// Actualizar estado de orden cuando el almacén responde
export const updateOrderStatus = mutation({
  args: {
    orderId: v.string(),
    status: v.string(),
    rejectionMessage: v.optional(v.string()), // Mensaje cuando es rechazado
  },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("pendingOrders")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .first();

    if (!order) {
      throw new Error(`Orden ${args.orderId} no encontrada`);
    }

    const updateData: {
      status: string;
      rejectionMessage?: string;
    } = {
      status: args.status,
    };
    
    // Si es rechazado y hay mensaje, guardarlo
    if (args.status === "rejected" && args.rejectionMessage) {
      updateData.rejectionMessage = args.rejectionMessage;
    }

    await ctx.db.patch(order._id, updateData);

    // Si la orden fue confirmada, limpiar el carrito
    if (args.status === "confirmed") {
      const cartItems = await ctx.db
        .query("cartItems")
        .withIndex("by_session", (q) => q.eq("sessionId", order.sessionId))
        .collect();

      for (const item of cartItems) {
        await ctx.db.delete(item._id);
      }
    }

    return {
      success: true,
      orderId: args.orderId,
      status: args.status,
    };
  },
});

// Obtener estado de una orden
export const getOrderStatus = query({
  args: {
    orderId: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("pendingOrders")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .first();

    return order;
  },
});

// Obtener órdenes pendientes de un usuario
export const getPendingOrders = query({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("pendingOrders")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    return orders;
  },
});
