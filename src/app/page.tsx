"use client";

import { ProductCard } from "@/components/ProductCard";
import { ShoppingCartSheet } from "@/components/ShoppingCartSheet";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSessionId } from "@/hooks/useSessionId";
import { Store, Package } from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const products = useQuery(api.products.getProducts);
  const addToCart = useMutation(api.cart.addToCart);
  const addSampleProducts = useMutation(api.products.addSampleProducts);
  const sessionId = useSessionId();

  const handleAddToCart = async (productId: string, productName: string) => {
    if (!sessionId) return;
    
    try {
      await addToCart({
        sessionId,
        productId: productId as any,
        quantity: 1,
      });
      
      toast.success("¡Producto agregado!", {
        description: `${productName} se agregó a tu carrito`,
      });
    } catch (error) {
      toast.error("Error", {
        description: "No se pudo agregar el producto al carrito",
      });
    }
  };

  const handleAddSampleProducts = async () => {
    try {
      await addSampleProducts();
      toast.success("¡Productos agregados!", {
        description: "Se agregaron productos de ejemplo a la tienda",
      });
    } catch (error) {
      toast.error("Error", {
        description: "No se pudieron agregar los productos de ejemplo",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Almacén Tech</h1>
            </div>
            <ShoppingCartSheet />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Nuestros Productos</h2>
          <p className="text-muted-foreground">
            Encuentra los mejores productos de tecnología
          </p>
        </div>

        {!products || products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay productos disponibles</h3>
            <p className="text-muted-foreground mb-6">
              Agrega productos de ejemplo para comenzar
            </p>
            <Button onClick={handleAddSampleProducts}>
              Agregar Productos de Ejemplo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                id={product._id}
                name={product.name}
                description={product.description}
                price={product.price}
                image={product.image}
                onAddToCart={() => handleAddToCart(product._id, product.name)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>© 2025 Almacén Tech. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
