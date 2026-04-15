import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Star, MapPin, Clock, ArrowRight } from "lucide-react"
import { foodTrucks, cuisineCategories } from "@/lib/data"

export const metadata: Metadata = {
  title: "All Food Trucks | FoodTruck CLT",
  description: "Browse all food trucks in Charlotte, NC. Filter by cuisine, view schedules, and find your next meal.",
}

export default function TrucksPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-4xl font-bold text-foreground">
              All Food Trucks
            </h1>
            <p className="mt-2 text-muted-foreground">
              Discover {foodTrucks.length} amazing food trucks serving Charlotte
            </p>
          </div>

          {/* Cuisine Filter */}
          <div className="mb-8 flex flex-wrap gap-2">
            {cuisineCategories.map((cat) => (
              <Button
                key={cat.id}
                variant={cat.id === "all" ? "default" : "outline"}
                size="sm"
              >
                {cat.name}
              </Button>
            ))}
          </div>

          {/* Trucks Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {foodTrucks.map((truck) => {
              const nextStop = truck.schedule[0]
              
              return (
                <Card key={truck.id} className="group overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all">
                  <Link href={`/trucks/${truck.slug}`}>
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={truck.image}
                        alt={truck.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3">
                        {truck.isOpen ? (
                          <Badge className="bg-green-500/90 text-white border-0">
                            <span className="relative mr-1.5 flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                            </span>
                            Open Now
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Closed</Badge>
                        )}
                      </div>
                      {truck.isFeatured && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-accent text-accent-foreground border-0">
                            Featured
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {truck.cuisine.slice(0, 2).map((c) => (
                          <span key={c} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {c}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                          {truck.name}
                        </h3>
                        <div className="flex items-center gap-1 text-sm shrink-0">
                          <Star className="h-4 w-4 fill-accent text-accent" />
                          <span className="font-medium">{truck.rating}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {truck.priceRange} · {truck.reviewCount} reviews
                      </p>
                      
                      {nextStop && (
                        <div className="pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-1">Next stop</p>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="truncate">{nextStop.location}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            <span>{nextStop.startTime} - {nextStop.endTime}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Link>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  )
}
