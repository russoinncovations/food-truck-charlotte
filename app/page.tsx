import type { Metadata } from "next";
import { CtaButton } from "@/components/cta-button";
import { EventCard } from "@/components/event-card";
import { FilterChips } from "@/components/filter-chips";
import MarqueeBar, { type MarqueeItem } from "@/components/MarqueeBar";
import { HeroSection } from "@/components/HeroSection";
import { SectionHeader } from "@/components/section-header";
import { trucks as staticTrucks } from "@/data/trucks";
import { fetchUpcomingEventsFromSupabase } from "@/lib/events-directory";
import { getSupabase } from "@/lib/supabase";
import { toTruckListItems } from "@/lib/trucks-directory";
import type { EventListItem, FoodTruck, FoodTruckListItem } from "@/lib/types";

const cuisineFilters = [...new Set(staticTrucks.map((truck) => truck.cuisine))];

export const metadata: Metadata = {
  title: "Find Food Trucks. Discover Events. Book a Truck.",
  description:
    "Charlotte's trusted guide to food truck discovery, local events, and straightforward booking inquiries.",
};

function foodTruckToListItem(t: FoodTruck): FoodTruckListItem {
  return {
    slug: t.slug,
    name: t.name,
    cuisine: t.cuisine,
    vendor_type: t.vendor_type,
    description: t.description,
    serviceArea: t.serviceArea,
    ...(t.catering ? { catering: true } : {}),
  };
}

function staticFeaturedList(): FoodTruckListItem[] {
  return [...staticTrucks]
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured))
    .slice(0, 5)
    .map(foodTruckToListItem);
}

function buildMarqueeItems(trucks: FoodTruckListItem[], events: EventListItem[]): MarqueeItem[] {
  const items: MarqueeItem[] = [
    ...trucks.slice(0, 4).map((t) => ({ label: t.name, sub: t.cuisine })),
    ...events.slice(0, 4).map((e) => ({ label: e.title, sub: e.formattedDate })),
  ];
  return items;
}

export default async function Home() {
  let totalTruckCount = staticTrucks.length;
  let featuredTrucks: FoodTruckListItem[] = staticFeaturedList();

  const client = getSupabase();
  let upcomingEvents: EventListItem[] = [];

  if (client) {
    const [{ count }, { data: featuredRows }, upcoming] = await Promise.all([
      client
        .from("trucks")
        .select("*", { count: "exact", head: true })
        .eq("active", true)
        .eq("show_in_directory", true),
      client
        .from("trucks")
        .select("*")
        .eq("active", true)
        .eq("show_in_directory", true)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(5),
      fetchUpcomingEventsFromSupabase(8),
    ]);

    if (typeof count === "number" && count > 0) {
      totalTruckCount = count;
    }

    const fromDb = toTruckListItems(featuredRows);
    if (fromDb.length > 0) {
      featuredTrucks = fromDb;
    }

    upcomingEvents = upcoming;
  }

  const eventListItems = upcomingEvents.slice(0, 2);
  const marqueeCandidates = buildMarqueeItems(featuredTrucks, upcomingEvents);
  const marqueeItems = marqueeCandidates.length >= 3 ? marqueeCandidates : undefined;

  return (
    <div className="space-y-16 md:space-y-20">
      <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2">
        <MarqueeBar items={marqueeItems} />
        <HeroSection featuredTrucks={featuredTrucks} totalTruckCount={totalTruckCount} />
      </div>

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
            <div
              key={step}
              className="rounded-xl border border-[#1E1E1E]/8 bg-white p-4 text-[15px] leading-7 text-[#1E1E1E]/82"
            >
              {step}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader title="Browse by Cuisine" description="Start with what sounds good, then narrow by truck and area." />
        <FilterChips filters={cuisineFilters} />
      </section>

      {eventListItems.length > 0 ? (
        <section className="space-y-7">
          <SectionHeader
            eyebrow="Featured Events"
            title="Featured Charlotte Food Truck Happenings"
            description="From neighborhood gatherings to brewery nights and school events, these are standout local happenings worth planning around."
          />
          <div className="grid gap-5 md:grid-cols-2">
            {eventListItems.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      ) : null}

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
          <CtaButton href="/about" variant="secondary">
            Join the Community
          </CtaButton>
        </div>
      </section>
    </div>
  );
}
