import type { Metadata } from "next";
import { CtaButton } from "@/components/cta-button";
import { EventCard } from "@/components/event-card";
import { FilterChips } from "@/components/filter-chips";
import { SectionHeader } from "@/components/section-header";
import { TruckCard } from "@/components/truck-card";
import { trucks } from "@/data/trucks";
import { featuredEvents, featuredTrucks, getTruckNames } from "@/lib/data-access";

const cuisineFilters = [...new Set(trucks.map((truck) => truck.cuisine))];

export const metadata: Metadata = {
  title: "Find Food Trucks. Discover Events. Book a Truck.",
  description:
    "Charlotte's trusted guide to food truck discovery, local events, and straightforward booking inquiries.",
};

export default function Home() {
  return (
    <div className="space-y-16 md:space-y-20">
      <section className="rounded-3xl border border-[#1E1E1E]/8 bg-[#fffdfa] p-6 shadow-[0_12px_32px_rgba(30,30,30,0.04)] md:p-11">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#D97A2B]">Charlotte Local Guide</p>
        <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-[#1E1E1E] md:text-[3.4rem] md:leading-[1.05]">
          Find Charlotte Food Trucks. Free to List. Free to Find.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#1E1E1E]/75">
          Built from Charlotte&apos;s largest food truck community — 35,000+ members strong. This is a free local guide first.
          Trucks list free while we build this together.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <CtaButton href="/find-food-trucks">Find Food Trucks</CtaButton>
          <CtaButton href="/book-a-truck" variant="secondary">
            Request a Truck
          </CtaButton>
        </div>
        <p className="mt-6 text-[15px] leading-7 text-[#1E1E1E]/68">
          Community-backed by a large Charlotte food truck network with on-the-ground local insight.
        </p>
      </section>

      <div style={{ borderTop: '1px solid #e5e0d8', borderBottom: '1px solid #e5e0d8', padding: '12px 0', textAlign: 'center', fontSize: '0.75rem', letterSpacing: '0.05em', color: '#6b6560' }}>
        35,000+ community members <span style={{ color: '#c2601f' }}>·</span> Charlotte-based since 2014 <span style={{ color: '#c2601f' }}>·</span> Free to list
      </div>

      <section className="space-y-7">
        <SectionHeader
          eyebrow="Featured Trucks"
          title="Curated Charlotte Trucks Locals Recommend"
          description="A trusted mix of neighborhood favorites and event-ready trucks with strong service reputations across Charlotte."
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featuredTrucks.map((truck) => (
            <TruckCard key={truck.slug} truck={truck} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#1E1E1E]/8 bg-[#fffdfa] p-6 md:p-7">
        <SectionHeader
          eyebrow="How It Works"
          title="Simple by Design, Reliable in Practice"
          description="This is a local guide first. You can find trucks, track events, and submit inquiries without the clutter of a full marketplace app."
        />
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {[
            "Browse by cuisine, service area, and event fit.",
            "See where local trucks are serving this week.",
            "Share one inquiry to start your booking process.",
          ].map((step) => (
            <div key={step} className="rounded-xl border border-[#1E1E1E]/8 bg-white p-4 text-[15px] leading-7 text-[#1E1E1E]/82">
              {step}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader title="Browse by Cuisine" description="Start with what sounds good, then narrow by truck and area." />
        <FilterChips filters={cuisineFilters} />
      </section>

      <section className="space-y-7">
        <SectionHeader
          eyebrow="Featured Events"
          title="Featured Charlotte Food Truck Happenings"
          description="From neighborhood gatherings to brewery nights and school events, these are standout local happenings worth planning around."
        />
        <div className="grid gap-5 md:grid-cols-2">
          {featuredEvents.map((event) => (
            <EventCard key={event.id} event={event} featuredNames={getTruckNames(event.featuredTruckSlugs)} />
          ))}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-[#1E1E1E]/8 bg-[#fffdfa] p-6">
          <h3 className="text-xl font-semibold text-[#1E1E1E]">For Trucks</h3>
          <p className="mt-3 text-[15px] leading-7 text-[#1E1E1E]/80">
            Get seen by people in Charlotte who are actively looking for trucks and planning real events.
          </p>
          <div className="mt-6">
            <CtaButton href="/for-trucks">Join the Directory</CtaButton>
          </div>
        </div>
        <div className="rounded-2xl border border-[#1E1E1E]/8 bg-[#fffdfa] p-6">
          <h3 className="text-xl font-semibold text-[#1E1E1E]">For Venues & Hosts</h3>
          <p className="mt-3 text-[15px] leading-7 text-[#1E1E1E]/80">
            Planning an event? Share your details and we&apos;ll help point you toward the right local trucks.
          </p>
          <div className="mt-6">
            <CtaButton href="/for-venues">Host Inquiry</CtaButton>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#1E1E1E]/8 bg-[#fffdfa] p-6 md:p-7">
        <SectionHeader
          eyebrow="Community"
          title="Built From a Real Charlotte Community"
          description="Food Truck Charlotte grew from one of the city&apos;s largest food truck Facebook communities. That foundation gives this brand stronger local relationships, better ground-level awareness, and real trust."
        />
        <div className="mt-5">
          <CtaButton href="/community" variant="secondary">
            Join the Community
          </CtaButton>
        </div>
      </section>
    </div>
  );
}
