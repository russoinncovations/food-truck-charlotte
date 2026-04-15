"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

const cuisines = [
  { id: "all", name: "All", icon: "🍽️" },
  { id: "tacos", name: "Tacos", icon: "🌮" },
  { id: "bbq", name: "BBQ", icon: "🍖" },
  { id: "desserts", name: "Desserts", icon: "🍩" },
  { id: "wings", name: "Wings", icon: "🍗" },
  { id: "latin", name: "Latin", icon: "🌶️" },
  { id: "soul", name: "Soul Food", icon: "🍳" },
  { id: "coffee", name: "Coffee", icon: "☕" },
  { id: "burgers", name: "Burgers", icon: "🍔" },
  { id: "caribbean", name: "Caribbean", icon: "🥥" },
]

interface CuisineFilterProps {
  selected: string
  onSelect: (cuisine: string) => void
}

export function CuisineFilter({ selected, onSelect }: CuisineFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {cuisines.map((cuisine) => (
        <button
          key={cuisine.id}
          onClick={() => onSelect(cuisine.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
            "border hover:border-primary/50",
            selected === cuisine.id
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-foreground border-border hover:bg-secondary"
          )}
        >
          <span className="text-base" role="img" aria-label={cuisine.name}>
            {cuisine.icon}
          </span>
          {cuisine.name}
        </button>
      ))}
    </div>
  )
}
