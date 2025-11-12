"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import { Id } from "../../convex/_generated/dataModel";

interface ProductCardProps {
  id: Id<"products">;
  name: string;
  description: string;
  price: number;
  image?: string;
  isNew?: boolean;
  category?: string;
  onAddToCart: () => void;
}

export function ProductCard({ name, description, price, image, isNew, category, onAddToCart }: ProductCardProps) {
  return (
    <Card className="group overflow-hidden border-0 shadow-none transition-all hover:shadow-sm py-0">
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-400">
            Sin imagen
          </div>
        )}
        {isNew && (
          <Badge className="absolute left-3 top-3 bg-white text-black hover:bg-white">
            Lo nuevo
          </Badge>
        )}
      </div>
      <CardContent className="space-y-2 p-4">
        <div className="space-y-1">
          {category && (
            <p className="text-sm font-medium text-orange-600">{category}</p>
          )}
          <h3 className="font-semibold text-black line-clamp-1">{name}</h3>
          <p className="text-sm text-neutral-600 line-clamp-2">{description}</p>
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <span className="text-lg font-semibold text-black">
            ${price.toFixed(2)}
          </span>
          <Button 
            size="sm"
            className="bg-black text-white hover:bg-neutral-800 cursor-pointer"
            onClick={onAddToCart}
          >
            <ShoppingCart className="mr-1.5 h-4 w-4" />
            Agregar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
