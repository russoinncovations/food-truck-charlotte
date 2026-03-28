import type { Metadata } from "next";
import { trucks as staticTrucks } from "@/data/trucks";
import { FindFoodTrucksContent } from "@/components/find-food-trucks-content";
import { SectionHeader } from "@/components/section-header";
import { fetchDirectoryTrucksFromSupabase } from "@/lib/trucks-directory";
import type { FoodTruckListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Find Food Vendors in Charlotte",
  description:
    "Browse Charlotte food vendors by cuisine and service area to find trusted local favorites for everyday stops and events.",
};

export default async function FindFoodTrucksPage() {
  const fromSupabase = await fetchDirectoryTrucksFromSupabase();
  const trucks: FoodTruckListItem[] =
    fromSupabase.length > 0 ? fromSupabase : staticTrucks;

  const cuisines = [...new Set(trucks.map((truck) => truck.cuisine))].sort((a, b) =>
    a.localeCompare(b),
  );

  return (
    <div className="space-y-10 md:space-y-12">
      <SectionHeader
        eyebrow="Directory"
        title="Find Food Vendors in Charlotte"
        description="Explore a curated local lineup by cuisine and service area, with practical details to help you pick with confidence."
      />

      <FindFoodTrucksContent trucks={trucks} cuisines={cuisines} />
    </div>
  );
}
