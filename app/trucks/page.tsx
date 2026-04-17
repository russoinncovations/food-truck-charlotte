import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

const cuisineFilterButtons = [
  { id: "all", name: "All" },
  { id: "mexican", name: "Mexican" },
  { id: "bbq", name: "BBQ" },
  { id: "desserts", name: "Desserts" },
  { id: "wings", name: "Wings" },
  { id: "asian", name: "Asian" },
  { id: "american", name: "American" },
]

const TRUCK_IMAGES = [
  "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1534790566855-4cb788d389ec?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1512689189935-c6c80733a4d4?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=400&h=300&fit=crop",
]

function getTruckImage(truckId: string): string {
  const index =
    truckId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % TRUCK_IMAGES.length
  return TRUCK_IMAGES[index]
}

export const metadata: Metadata = {
  title: "All Food Trucks | FoodTruck CLT",
  description: "Browse all food trucks in Charlotte, NC. Filter by cuisine, view schedules, and find your next meal.",
}

export default async function TrucksPage() {
  const supabase = await createClient()
  const { data: trucks } = await supabase
    .from("trucks")
    .select("id, name, cuisine, slug, serving_today, today_location, show_in_directory")
    .eq("show_in_directory", true)
    .order("name")

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
              Discover {trucks?.length ?? 0} amazing food trucks serving Charlotte
            </p>
          </div>

          {/* Cuisine Filter */}
          <div className="mb-8 flex flex-wrap gap-2">
            {cuisineFilterButtons.map((cat) => (
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
            {(trucks ?? []).map((truck) => {
              const cuisineTags = [truck.cuisine].filter(Boolean) as string[]

              return (
                <Card key={truck.id} className="group overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all">
                  <Link href={`/trucks/${truck.slug}`}>
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={getTruckImage(truck.id)}
                        alt={truck.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3">
                        {truck.serving_today ? (
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
                    </div>

                    <CardContent className="p-4">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {cuisineTags.slice(0, 2).map((c) => (
                          <span key={c} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {c}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                          {truck.name}
                        </h3>
                      </div>
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
