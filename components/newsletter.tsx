"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, CheckCircle2, Users, Bell, Calendar } from "lucide-react"

const features = [
  { icon: Calendar, text: "Weekly truck schedules" },
  { icon: Bell, text: "New event alerts" },
  { icon: Users, text: "Community picks" },
]

export function Newsletter() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In production, this would submit to an API
    setIsSubmitted(true)
  }

  return (
    <section className="py-16 md:py-24 bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Get the weekly schedule
            </h2>
            <p className="text-background/70 text-lg mb-8">
              Every Sunday, we send out where trucks will be that week. 
              It&apos;s the same list our 35K Facebook group members rely on.
            </p>

            {/* Features */}
            <div className="flex flex-wrap gap-6">
              {features.map((feature) => (
                <div key={feature.text} className="flex items-center gap-2">
                  <feature.icon className="h-5 w-5 text-accent" />
                  <span className="text-sm text-background/80">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="bg-background/10 backdrop-blur rounded-2xl p-8">
            {isSubmitted ? (
              <div className="text-center py-8">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 mb-4">
                  <CheckCircle2 className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">You&apos;re in!</h3>
                <p className="text-background/70">
                  Check your inbox for a welcome email with this week&apos;s schedule.
                </p>
              </div>
            ) : (
              <>
                <h3 className="font-display text-xl font-bold mb-2">
                  Free weekly email
                </h3>
                <p className="text-background/70 text-sm mb-6">
                  Truck schedules, new events, and community picks. Sundays at 9am.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-background text-foreground border-0"
                  />
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    Subscribe - It&apos;s Free
                  </Button>
                  <p className="text-xs text-background/50 text-center">
                    No spam, ever. Unsubscribe anytime.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
