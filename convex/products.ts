import { query, mutation } from "./_generated/server";

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
        name: "MacBook Pro M3",
        description: "Laptop profesional con chip M3, pantalla Retina de 14 pulgadas",
        price: 1999.99,
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
        category: "Computadoras",
        isNew: true,
        externalId: "1", // ID en el sistema del intermediario
      },
      {
        name: "Dell XPS 15",
        description: "Ultrabook premium con procesador Intel i7, 16GB RAM",
        price: 1599.99,
        image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800",
        category: "Computadoras",
        isNew: false,
        externalId: "2",
      },
      {
        name: "Gaming PC RTX 4090",
        description: "PC Gaming de alto rendimiento con RTX 4090, 32GB RAM",
        price: 3499.99,
        image: "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800",
        category: "Computadoras",
        isNew: true,
        externalId: "3",
      },
    ];

    for (const product of products) {
      await ctx.db.insert("products", product);
    }

    return { success: true, count: products.length };
  },
});
