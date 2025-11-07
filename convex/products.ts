import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Obtener todos los productos
export const getProducts = query({
  handler: async (ctx) => {
    return await ctx.db.query("products").collect();
  },
});

// Agregar productos de ejemplo (para testing)
export const addSampleProducts = mutation({
  handler: async (ctx) => {
    const products = [
      {
        name: "Laptop Gaming Pro",
        description: "Laptop de alto rendimiento con RTX 4060, 16GB RAM",
        price: 1299.99,
        image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400",
      },
      {
        name: "Teclado Mecánico RGB",
        description: "Teclado mecánico con switches Cherry MX e iluminación RGB",
        price: 149.99,
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400",
      },
      {
        name: "Mouse Inalámbrico",
        description: "Mouse ergonómico inalámbrico con sensor de 16000 DPI",
        price: 79.99,
        image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400",
      },
    ];

    for (const product of products) {
      await ctx.db.insert("products", product);
    }

    return { success: true, count: products.length };
  },
});
