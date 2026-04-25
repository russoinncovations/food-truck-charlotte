import { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { QuickAddEventForm } from "@/components/admin/quick-add-event-form"

export const metadata: Metadata = {
  title: "Quick Add Event | Admin | FoodTruck CLT",
  description: "Add a food truck event from a flyer or post.",
}

export default async function AdminQuickAddEventPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>
}) {
  const key = (await searchParams)?.key
  const adminKey = process.env.ADMIN_KEY ?? "7985"
  if (key !== adminKey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Page not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground mb-4">
            <Link href={`/admin/events?key=${encodeURIComponent(key)}`} className="hover:text-foreground">
              ← Back to event admin
            </Link>
          </p>
          <div className="mb-6">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Quick Add Event</h1>
            <p className="mt-2 text-muted-foreground max-w-2xl">
              Add an event from a flyer, Facebook post, or organizer submission.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>New event</CardTitle>
              <CardDescription>
                Saved to the <code className="text-xs">events</code> table. Set status to <strong>draft</strong> to
                keep it off the public calendar, or <strong>approved</strong> to go live (default).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuickAddEventForm adminKey={key} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
