import { Button } from "@/components/ui/button"
import { Truck, Users, ArrowRight, CheckCircle } from "lucide-react"

const truckBenefits = [
  "Get seen by people actively looking for trucks",
  "Reach planners organizing real events",
  "Free listing in our directory",
  "Direct booking inquiries to you",
]

const hostBenefits = [
  "Browse Charlotte's best food trucks",
  "Filter by cuisine and availability",
  "Submit one inquiry, reach multiple trucks",
  "No fees, just connections",
]

export function VendorsSection() {
  return (
    <section id="vendors" className="py-24 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
            For Vendors & Hosts
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Whether You&apos;re Serving or Planning
          </h2>
          <p className="mt-4 text-muted-foreground">
            Food Truck CLT connects Charlotte&apos;s best mobile kitchens with people planning memorable events.
          </p>
        </div>

        {/* Two Column Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* For Trucks */}
          <div className="relative bg-card rounded-2xl border border-border p-8 lg:p-10 overflow-hidden group hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Truck className="h-7 w-7 text-primary" />
              </div>
              
              <h3 className="font-display text-2xl font-bold text-foreground mb-3">
                For Trucks
              </h3>
              <p className="text-muted-foreground mb-6">
                Get seen by people in Charlotte who are actively looking for trucks and planning real events.
              </p>

              <ul className="space-y-3 mb-8">
                {truckBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Button className="w-full sm:w-auto gap-2">
                List Your Truck
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* For Hosts */}
          <div className="relative bg-card rounded-2xl border border-border p-8 lg:p-10 overflow-hidden group hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center mb-6">
                <Users className="h-7 w-7 text-accent-foreground" />
              </div>
              
              <h3 className="font-display text-2xl font-bold text-foreground mb-3">
                For Venues & Hosts
              </h3>
              <p className="text-muted-foreground mb-6">
                Planning an event? Share your details and we&apos;ll help point you toward the right local trucks.
              </p>

              <ul className="space-y-3 mb-8">
                {hostBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Button variant="outline" className="w-full sm:w-auto gap-2">
                Plan Your Event
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
