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
      {
        name: "Teclado Mecánico Keychron",
        description: "Teclado mecánico inalámbrico con switches Gateron",
        price: 129.99,
        image: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=800",
        category: "Accesorios",
        isNew: false,
        externalId: "4",
      },
      {
        name: "Mouse Logitech MX Master 3",
        description: "Mouse ergonómico inalámbrico para productividad",
        price: 99.99,
        image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800",
        category: "Accesorios",
        isNew: false,
        externalId: "5",
      },
      {
        name: "Monitor LG UltraWide 34",
        description: "Monitor curvo ultrawide 34 pulgadas QHD",
        price: 599.99,
        image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800",
        category: "Monitores",
        isNew: true,
        externalId: "6",
      },
      {
        name: "iPad Pro 12.9",
        description: "Tablet profesional con chip M2, pantalla Liquid Retina",
        price: 1099.99,
        image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800",
        category: "Tablets",
        isNew: true,
        externalId: "7",
      },
      {
        name: "AirPods Pro 2",
        description: "Audífonos inalámbricos con cancelación de ruido activa",
        price: 249.99,
        image: "https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=800",
        category: "Audio",
        isNew: true,
        externalId: "8",
      },
      {
        name: "Sony WH-1000XM5",
        description: "Audífonos over-ear con la mejor cancelación de ruido",
        price: 399.99,
        image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800",
        category: "Audio",
        isNew: false,
        externalId: "9",
      },
    ];

    for (const product of products) {
      await ctx.db.insert("products", product);
    }

    return { success: true, count: products.length };
  },
});
