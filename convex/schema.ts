import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  products: defineTable({
    name: v.string(),
    description: v.string(),
    price: v.number(),
    image: v.optional(v.string()),
  }),
  
  cartItems: defineTable({
    productId: v.id("products"),
    quantity: v.number(),
    sessionId: v.string(), // Para identificar el carrito del usuario
  }).index("by_session", ["sessionId"])
    .index("by_session_and_product", ["sessionId", "productId"]),
});
