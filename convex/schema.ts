import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  products: defineTable({
    name: v.string(),
    description: v.string(),
    price: v.number(),
    image: v.optional(v.string()),
    category: v.optional(v.string()),
    isNew: v.optional(v.boolean()),
    externalId: v.optional(v.string()), // ID del producto en el sistema del intermediario/almacén
  }),
  
  cartItems: defineTable({
    productId: v.id("products"),
    quantity: v.number(),
    sessionId: v.string(), // Para identificar el carrito del usuario
  }).index("by_session", ["sessionId"])
    .index("by_session_and_product", ["sessionId", "productId"]),

  // Órdenes pendientes de confirmación del almacén
  pendingOrders: defineTable({
    sessionId: v.string(),
    orderId: v.string(),
    products: v.array(v.object({
      productId: v.string(),
      externalId: v.string(), // ID del producto en el sistema del intermediario
      quantity: v.number(),
      price: v.number(),
    })),
    totalAmount: v.number(),
    status: v.string(), // "pending", "confirmed", "rejected"
    createdAt: v.number(),
  }).index("by_session", ["sessionId"])
    .index("by_orderId", ["orderId"])
    .index("by_status", ["status"]),
});
