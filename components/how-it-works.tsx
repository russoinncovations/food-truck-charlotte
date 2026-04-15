import { Search, Calendar, MessageSquare, CheckCircle } from "lucide-react"

const steps = [
  {
    icon: Search,
    title: "Browse & Discover",
    description: "Browse by cuisine, service area, and event fit to find the perfect truck for your needs.",
  },
  {
    icon: Calendar,
    title: "See Who's Serving",
    description: "Check where local trucks are serving this week with real-time availability updates.",
  },
  {
    icon: MessageSquare,
    title: "Submit an Inquiry",
    description: "Share one inquiry to start your booking process with your chosen food truck.",
  },
  {
    icon: CheckCircle,
    title: "Confirm & Enjoy",
    description: "Finalize details directly with the vendor and enjoy amazing food at your event.",
  },
]

export function HowItWorks() {
  return (
    <section className="py-24 bg-background">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
            How It Works
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Simple by Design, Reliable in Practice
          </h2>
          <p className="mt-4 text-muted-foreground">
            This is a local guide first. You can find trucks, track events, and submit inquiries 
            without the clutter of a full marketplace app.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="relative group">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-border" />
              )}
              
              {/* Step Card */}
              <div className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                {/* Step Number */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </div>
                
                {/* Icon */}
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                
                {/* Content */}
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
