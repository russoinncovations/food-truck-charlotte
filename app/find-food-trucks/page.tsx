import type { Metadata } from "next";
import { FilterChips } from "@/components/filter-chips";
import { SectionHeader } from "@/components/section-header";
import { TruckCard } from "@/components/truck-card";
import { trucks } from "@/data/trucks";

const cuisines = [...new Set(trucks.map((truck) => truck.cuisine))];

export const metadata: Metadata = {
  title: "Find Food Trucks in Charlotte",
  description:
    "Browse Charlotte food trucks by cuisine and service area to find trusted local favorites for everyday stops and events.",
};

export default function FindFoodTrucksPage() {
  return (
    <div className="space-y-10 md:space-y-12">
      <SectionHeader
        eyebrow="Directory"
        title="Find Food Trucks in Charlotte"
        description="Explore a curated local lineup by cuisine and service area, with practical details to help you pick with confidence."
      />

      <section className="rounded-2xl border border-[#1E1E1E]/8 bg-[#fffdfa] p-5 md:p-6">
        <label className="block text-sm font-medium text-[#1E1E1E]">
          Search Trucks
          <input
            type="search"
            placeholder="Try tacos, burgers, BBQ, coffee..."
            className="mt-2 w-full rounded-xl border border-[#1E1E1E]/15 bg-white px-4 py-3 text-sm outline-none ring-[#D97A2B] focus:ring-2"
          />
        </label>
        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#1E1E1E]/70">Cuisine Filters</p>
          <FilterChips filters={cuisines} />
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {trucks.map((truck) => (
          <TruckCard key={truck.slug} truck={truck} />
        ))}
      </section>
    </div>
  );
}
