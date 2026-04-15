import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface TruckCardProps {
  truck: {
    id: string
    name: string
    cuisine: string
    image: string
    location: string
    status: "available" | "inquire" | "at-event"
    rating: number
    reviews: number
  }
}

const statusConfig = {
  available: { label: "Available", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  inquire: { label: "Inquire", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  "at-event": { label: "At Event", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
}

export function TruckCard({ truck }: TruckCardProps) {
  const status = statusConfig[truck.status]

  return (
    <div className="group relative bg-card rounded-xl overflow-hidden border border-border transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={truck.image}
          alt={truck.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Status Badge */}
        <Badge 
          variant="outline" 
          className={cn("absolute top-3 right-3 border", status.className)}
        >
          {status.label}
        </Badge>

        {/* Rating */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs font-medium text-white">{truck.rating}</span>
          <span className="text-xs text-white/70">({truck.reviews})</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
              {truck.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">{truck.cuisine}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span>{truck.location}</span>
        </div>

        <Button variant="outline" size="sm" className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">
          View Details
        </Button>
      </div>
    </div>
  )
}
