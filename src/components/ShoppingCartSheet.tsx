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
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge 
              className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
              variant="destructive"
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Carrito de Compras</SheetTitle>
          <SheetDescription>
            {totalItems === 0 ? "Tu carrito está vacío" : `${totalItems} ${totalItems === 1 ? 'producto' : 'productos'} en tu carrito`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8 flex flex-col gap-4">
          {!cartItems || cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay productos en tu carrito</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-4 max-h-[calc(100vh-300px)]">
                {cartItems.map((item) => (
                  item.product && (
                    <div key={item._id} className="flex gap-4 border rounded-lg p-4">
                      <div className="relative h-20 w-20 overflow-hidden rounded-md bg-neutral-100 shrink-0">
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
                      
                      <div className="flex flex-1 flex-col gap-2">
                        <div className="flex justify-between">
                          <h4 className="font-semibold text-sm line-clamp-1">{item.product.name}</h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleRemoveItem(item._id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Select
                            value={item.quantity.toString()}
                            onValueChange={(value) => handleQuantityChange(item._id, parseInt(value))}
                          >
                            <SelectTrigger className="w-20 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <span className="font-bold">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          ${item.product.price.toFixed(2)} c/u
                        </p>
                      </div>
                    </div>
                  )
                ))}
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-2">
                  <Button className="w-full" size="lg">
                    Proceder al Pago
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleClearCart}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Vaciar Carrito
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
