import type { Metadata } from "next";
import { EventCard } from "@/components/event-card";
import { SectionHeader } from "@/components/section-header";
import { events } from "@/data/events";
import { getTruckNames } from "@/lib/data-access";

export const metadata: Metadata = {
  title: "Charlotte Food Truck Events",
  description:
    "Discover upcoming Charlotte food truck events, from neighborhood nights to local pop-ups featuring trusted trucks.",
};

export default function EventsPage() {
  return (
    <div className="space-y-10 md:space-y-12">
      <SectionHeader
        eyebrow="Events"
        title="Featured Food Truck Events Across Charlotte"
        description="Track standout local happenings, from neighborhood socials and school nights to brewery events and weekend pop-ups."
      />
      <section className="grid gap-5 md:grid-cols-2">
        {events.map((event) => (
          <EventCard key={event.id} event={event} featuredNames={getTruckNames(event.featuredTruckSlugs)} />
        ))}
      </section>
    </div>
  );
}
