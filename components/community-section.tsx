import { Button } from "@/components/ui/button"
import { Facebook, Instagram, ArrowRight, Heart, Users, MessageCircle } from "lucide-react"

const stats = [
  { value: "35K+", label: "Community Members", icon: Users },
  { value: "6+", label: "Years Running", icon: Heart },
  { value: "Daily", label: "Active Discussions", icon: MessageCircle },
]

export function CommunitySection() {
  return (
    <section id="community" className="py-24 bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
              Community
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-background">
              Built From a Real Charlotte Community
            </h2>
            <p className="mt-6 text-background/70 leading-relaxed">
              Food Truck Charlotte grew from one of the city&apos;s largest food truck Facebook communities. 
              That foundation gives this brand stronger local relationships, better ground-level awareness, 
              and real trust.
            </p>
            <p className="mt-4 text-background/70 leading-relaxed">
              We&apos;re not a national platform trying to enter Charlotte. We are Charlotte. Every truck 
              listing, every event post, every recommendation comes from real people who live and eat here.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button className="gap-2 bg-background text-foreground hover:bg-background/90">
                <Facebook className="h-4 w-4" />
                Join Our Facebook
              </Button>
              <Button variant="outline" className="gap-2 border-background/30 text-background hover:bg-background/10">
                <Instagram className="h-4 w-4" />
                Follow on Instagram
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {stats.map((stat) => (
              <div 
                key={stat.label} 
                className="relative p-6 rounded-2xl bg-background/5 border border-background/10 text-center hover:bg-background/10 transition-colors"
              >
                <stat.icon className="h-8 w-8 text-primary mx-auto mb-4" />
                <div className="font-display text-3xl font-bold text-background">
                  {stat.value}
                </div>
                <div className="text-sm text-background/60 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
