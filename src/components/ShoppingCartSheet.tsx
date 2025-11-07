"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Trash2, X } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSessionId } from "@/hooks/useSessionId";
import { Id } from "../../convex/_generated/dataModel";
import Image from "next/image";

export function ShoppingCartSheet() {
  const sessionId = useSessionId();
  const cartItems = useQuery(api.cart.getCartItems, sessionId ? { sessionId } : "skip");
  const updateQuantity = useMutation(api.cart.updateCartItemQuantity);
  const removeItem = useMutation(api.cart.removeFromCart);
  const clearCart = useMutation(api.cart.clearCart);

  const totalItems = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const totalPrice = cartItems?.reduce((sum, item) => {
    if (item.product) {
      return sum + (item.product.price * item.quantity);
    }
    return sum;
  }, 0) || 0;

  const handleQuantityChange = async (itemId: Id<"cartItems">, newQuantity: number) => {
    await updateQuantity({ itemId, quantity: newQuantity });
  };

  const handleRemoveItem = async (itemId: Id<"cartItems">) => {
    await removeItem({ itemId });
  };

  const handleClearCart = async () => {
    if (sessionId && cartItems && cartItems.length > 0) {
      await clearCart({ sessionId });
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative cursor-pointer">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge 
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-black text-white hover:bg-black"
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="border-b pb-4 px-6 pt-6">
          <SheetTitle className="text-xl">Bolsa de compras</SheetTitle>
          <SheetDescription>
            {totalItems === 0 ? "Tu bolsa está vacía" : `${totalItems} ${totalItems === 1 ? 'artículo' : 'artículos'}`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden px-6">
          {!cartItems || cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center flex-1">
              <ShoppingCart className="h-16 w-16 text-neutral-300 mb-4" />
              <p className="text-neutral-500">No hay artículos en tu bolsa</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-6 py-6 -mx-2 px-2">
                {cartItems.map((item) => (
                  item.product && (
                    <div key={item._id} className="flex gap-4 pb-6 border-b border-neutral-100 last:border-0">
                      <div className="relative h-32 w-32 overflow-hidden rounded bg-neutral-100 shrink-0">
                        {item.product.image ? (
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                            Sin imagen
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-1 flex-col justify-between min-w-0">
                        <div>
                          <h4 className="font-medium text-base mb-1">{item.product.name}</h4>
                          <p className="text-sm text-neutral-500 mb-2 line-clamp-2">{item.product.description}</p>
                          <p className="text-sm text-neutral-600">${item.product.price.toFixed(2)}</p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <Select
                            value={item.quantity.toString()}
                            onValueChange={(value) => handleQuantityChange(item._id, parseInt(value))}
                          >
                            <SelectTrigger className="w-20 h-9 text-sm cursor-pointer">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                <SelectItem key={num} value={num.toString()} className="cursor-pointer">
                                  {num}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item._id)}
                            className="text-neutral-500 hover:text-neutral-900 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>

              <div className="border-t pt-6 pb-6 space-y-4 mt-auto">
                <div className="flex justify-between items-center text-base">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-semibold text-lg">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-2">
                  <Button className="w-full h-12 bg-black text-white hover:bg-neutral-800 rounded-full text-base cursor-pointer" size="lg">
                    Tramitar pedido
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full hover:bg-neutral-50 cursor-pointer"
                    onClick={handleClearCart}
                  >
                    Vaciar bolsa
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
