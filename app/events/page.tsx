import type { Metadata } from "next";
import { CtaButton } from "@/components/cta-button";
import { EventCard } from "@/components/event-card";
import { SectionHeader } from "@/components/section-header";
import { fetchActiveEventsFromSupabase } from "@/lib/events-directory";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Charlotte Food Truck Events",
  description:
    "Discover upcoming Charlotte food truck events, from neighborhood nights to local pop-ups featuring trusted trucks.",
};

export default async function EventsPage() {
  const events = await fetchActiveEventsFromSupabase();

  return (
    <div className="space-y-10 md:space-y-12">
      <div className="flex justify-end">
        <CtaButton href="/submit-event">Submit Your Event →</CtaButton>
      </div>
      <SectionHeader
        eyebrow="Events"
        title="Featured Food Truck Events Across Charlotte"
        description="Track standout local happenings, from neighborhood socials and school nights to brewery events and weekend pop-ups."
      />
      {events.length === 0 ? (
        <p className="text-center text-[15px] leading-7 text-[#1E1E1E]/70">
          No upcoming events — check back soon
        </p>
      ) : (
        <section className="grid gap-5 md:grid-cols-2">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </section>
      )}
    </div>
  );
}
