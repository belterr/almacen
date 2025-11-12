"use client";

import { ProductCard } from "@/components/ProductCard";
import { ShoppingCartSheet } from "@/components/ShoppingCartSheet";
import { FilterSidebar } from "@/components/FilterSidebar";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useSessionId } from "@/hooks/useSessionId";
import { Package, SlidersHorizontal, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo } from "react";

export default function Home() {
  const products = useQuery(api.products.getProducts);
  const addToCart = useMutation(api.cart.addToCart);
  const addSampleProducts = useMutation(api.products.addSampleProducts);
  const sessionId = useSessionId();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Obtener categorías únicas
  const categories = useMemo(() => {
    if (!products) return [];
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [products]);

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!selectedCategory) return products;
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const handleAddToCart = async (productId: Id<"products">, productName: string) => {
    if (!sessionId) return;
    
    try {
      await addToCart({
        sessionId,
        productId: productId,
        quantity: 1,
      });
      
      toast.success("¡Producto agregado!", {
        description: `${productName} se agregó a tu carrito`,
      });
    } catch {
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
    } catch {
      toast.error("Error", {
        description: "No se pudieron agregar los productos de ejemplo",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="border-b border-neutral-200 bg-neutral-50">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-end gap-4 text-xs">
            <button className="hover:text-neutral-600 cursor-pointer">Buscar tienda</button>
            <button className="hover:text-neutral-600 cursor-pointer">Ayuda</button>
            <button className="hover:text-neutral-600 cursor-pointer">Únete</button>
            <button className="hover:text-neutral-600 cursor-pointer">Iniciar sesión</button>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold">ALMACÉN</h1>
              
              {/* Navigation */}
              <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
                <a href="#" className="hover:text-neutral-600 cursor-pointer">Lo Nuevo</a>
                <a href="#" className="hover:text-neutral-600 cursor-pointer">Hombre</a>
                <a href="#" className="hover:text-neutral-600 cursor-pointer">Mujer</a>
                <a href="#" className="hover:text-neutral-600 cursor-pointer">Niño/a</a>
                <a href="#" className="hover:text-neutral-600 cursor-pointer">Ofertas</a>
              </nav>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <ShoppingCartSheet />
            </div>
          </div>
        </div>
      </header>

      {/* Promo Banner */}
      <div className="bg-neutral-100 text-center py-3 text-sm">
        <p>Obtén MSI, producto exclusivo, envío y devoluciones gratis al ser miembro. <span className="underline cursor-pointer font-medium">Únete.</span></p>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Desktop */}
          <div className="hidden lg:block">
            <FilterSidebar 
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>

          {/* Mobile Filter Toggle */}
          <div className="lg:hidden">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
            
            {showFilters && (
              <div className="mt-4 border rounded-lg p-4">
                <FilterSidebar 
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                />
              </div>
            )}
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {selectedCategory || "Todos los productos"} ({filteredProducts?.length || 0})
              </h2>
              <div className="flex items-center gap-4">
                <button className="hidden md:flex items-center gap-2 text-sm cursor-pointer hover:text-neutral-600">
                  Ocultar filtros
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
                <button className="flex items-center gap-2 text-sm cursor-pointer hover:text-neutral-600">
                  Ordenar por
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {!products || products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Package className="h-16 w-16 text-neutral-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No hay productos disponibles</h3>
                <p className="text-neutral-600 mb-6">
                  Agrega productos de ejemplo para comenzar
                </p>
                <Button 
                  onClick={handleAddSampleProducts}
                  className="bg-black text-white hover:bg-neutral-800 cursor-pointer"
                >
                  Agregar Productos de Ejemplo
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    id={product._id}
                    name={product.name}
                    description={product.description}
                    price={product.price}
                    image={product.image}
                    category={product.category}
                    isNew={product.isNew}
                    onAddToCart={() => handleAddToCart(product._id, product.name)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black text-white mt-24">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">ENCUENTRA UNA TIENDA</h3>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><a href="#" className="hover:text-white cursor-pointer">Hazte miembro</a></li>
                <li><a href="#" className="hover:text-white cursor-pointer">Regístrate para recibir emails</a></li>
                <li><a href="#" className="hover:text-white cursor-pointer">Envíanos tus comentarios</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">OBTÉN AYUDA</h3>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><a href="#" className="hover:text-white cursor-pointer">Estado del pedido</a></li>
                <li><a href="#" className="hover:text-white cursor-pointer">Envío y entrega</a></li>
                <li><a href="#" className="hover:text-white cursor-pointer">Devoluciones</a></li>
                <li><a href="#" className="hover:text-white cursor-pointer">Opciones de pago</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">ACERCA DE</h3>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><a href="#" className="hover:text-white cursor-pointer">Noticias</a></li>
                <li><a href="#" className="hover:text-white cursor-pointer">Empleo</a></li>
                <li><a href="#" className="hover:text-white cursor-pointer">Inversionistas</a></li>
                <li><a href="#" className="hover:text-white cursor-pointer">Sustentabilidad</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-800 mt-12 pt-6 text-xs text-neutral-400 text-center">
            <p>© 2025 Almacén Tech. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
