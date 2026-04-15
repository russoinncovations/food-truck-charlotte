"use client"

import { useState } from "react"
import { CuisineFilter } from "@/components/cuisine-filter"
import { TruckCard } from "@/components/truck-card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

const trucks = [
  {
    id: "1",
    name: "Latin Stop",
    cuisine: "Latin",
    image: "/images/truck-tacos.jpg",
    location: "Charlotte area",
    status: "available" as const,
    rating: 4.9,
    reviews: 127,
  },
  {
    id: "2",
    name: "Lela's Mini Donuts",
    cuisine: "Desserts",
    image: "/images/truck-desserts.jpg",
    location: "Charlotte area",
    status: "inquire" as const,
    rating: 4.8,
    reviews: 89,
  },
  {
    id: "3",
    name: "The Plated Palette",
    cuisine: "American BBQ",
    image: "/images/truck-bbq.jpg",
    location: "Charlotte area",
    status: "at-event" as const,
    rating: 4.7,
    reviews: 156,
  },
  {
    id: "4",
    name: "Saucy Girl Taco Truck",
    cuisine: "Tacos",
    image: "/images/truck-tacos.jpg",
    location: "Charlotte area",
    status: "available" as const,
    rating: 4.9,
    reviews: 203,
  },
  {
    id: "5",
    name: "Wing Boss CLT",
    cuisine: "Wings",
    image: "/images/truck-wings.jpg",
    location: "Charlotte area",
    status: "inquire" as const,
    rating: 4.6,
    reviews: 94,
  },
  {
    id: "6",
    name: "Anna's Cuisine LLC",
    cuisine: "Soul Food",
    image: "/images/truck-bbq.jpg",
    location: "Charlotte area",
    status: "available" as const,
    rating: 4.8,
    reviews: 112,
  },
]

export function TrucksSection() {
  const [selectedCuisine, setSelectedCuisine] = useState("all")

  const filteredTrucks = selectedCuisine === "all" 
    ? trucks 
    : trucks.filter(truck => 
        truck.cuisine.toLowerCase().includes(selectedCuisine.toLowerCase())
      )

  return (
    <section id="trucks" className="py-24 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
              Featured Trucks
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Browse by Cuisine
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg">
              Start with what sounds good, then narrow by truck and area.
            </p>
          </div>
          <Button variant="ghost" className="gap-2 self-start lg:self-auto text-primary hover:text-primary">
            Browse All 16 Trucks
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Cuisine Filter */}
        <div className="mb-10">
          <CuisineFilter selected={selectedCuisine} onSelect={setSelectedCuisine} />
        </div>

        {/* Truck Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrucks.map((truck) => (
            <TruckCard key={truck.id} truck={truck} />
          ))}
        </div>

        {filteredTrucks.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No trucks found for this cuisine. Try another category!</p>
          </div>
        )}
      </div>
    </section>
  )
}
