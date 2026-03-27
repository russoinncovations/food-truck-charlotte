import type { Metadata } from "next";
import { FindFoodTrucksContent } from "@/components/find-food-trucks-content";
import { SectionHeader } from "@/components/section-header";
import { trucks } from "@/data/trucks";

const cuisines = [...new Set(trucks.map((truck) => truck.cuisine))];

export const metadata: Metadata = {
  title: "Find Food Vendors in Charlotte",
  description:
    "Browse Charlotte food vendors by cuisine and service area to find trusted local favorites for everyday stops and events.",
};

export default function FindFoodTrucksPage() {
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
