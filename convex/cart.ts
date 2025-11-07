import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Obtener items del carrito por sessionId
export const getCartItems = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    // Obtener los detalles de cada producto
    const itemsWithProducts = await Promise.all(
      cartItems.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        return {
          ...item,
          product,
        };
      })
    );

    return itemsWithProducts;
  },
});

// Agregar item al carrito
export const addToCart = mutation({
  args: {
    sessionId: v.string(),
    productId: v.id("products"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    // Verificar si el producto ya está en el carrito
    const existingItem = await ctx.db
      .query("cartItems")
      .withIndex("by_session_and_product", (q) =>
        q.eq("sessionId", args.sessionId).eq("productId", args.productId)
      )
      .first();

    if (existingItem) {
      // Actualizar cantidad
      await ctx.db.patch(existingItem._id, {
        quantity: existingItem.quantity + args.quantity,
      });
      return existingItem._id;
    } else {
      // Crear nuevo item
      return await ctx.db.insert("cartItems", {
        sessionId: args.sessionId,
        productId: args.productId,
        quantity: args.quantity,
      });
    }
  },
});

// Actualizar cantidad de un item
export const updateCartItemQuantity = mutation({
  args: {
    itemId: v.id("cartItems"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.quantity <= 0) {
      // Si la cantidad es 0 o menos, eliminar el item
      await ctx.db.delete(args.itemId);
    } else {
      await ctx.db.patch(args.itemId, {
        quantity: args.quantity,
      });
    }
  },
});

// Eliminar item del carrito
export const removeFromCart = mutation({
  args: { itemId: v.id("cartItems") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.itemId);
  },
});

// Limpiar carrito
export const clearCart = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    for (const item of cartItems) {
      await ctx.db.delete(item._id);
    }
  },
});
