"use client";

import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface FilterSidebarProps {
  categories: string[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export function FilterSidebar({ categories, selectedCategory, onCategoryChange }: FilterSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside className="w-full lg:w-64 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Tienda</h2>
      </div>

      {/* Categorías */}
      <div className="space-y-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between py-2 text-left font-medium cursor-pointer"
        >
          Categorías
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        
        {isOpen && (
          <div className="space-y-1 pl-2">
            <button
              onClick={() => onCategoryChange(null)}
              className={`block w-full text-left py-1.5 px-2 rounded transition-colors cursor-pointer ${
                selectedCategory === null 
                  ? "bg-neutral-100 font-medium" 
                  : "hover:bg-neutral-50"
              }`}
            >
              Todos los productos
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={`block w-full text-left py-1.5 px-2 rounded transition-colors cursor-pointer ${
                  selectedCategory === category 
                    ? "bg-neutral-100 font-medium" 
                    : "hover:bg-neutral-50"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-px bg-neutral-200" />

      {/* Filtros adicionales */}
      <div className="space-y-2">
        <h3 className="font-medium">Novedades</h3>
        <div className="space-y-1 pl-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" className="rounded cursor-pointer" />
            <span className="text-sm">Lo nuevo</span>
          </label>
        </div>
      </div>
    </aside>
  );
}
