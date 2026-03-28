"use client";

import { useMemo, useState } from "react";
import { FilterChips } from "@/components/filter-chips";
import { DirectoryTruckCard } from "@/components/directory-truck-card";
import type { FoodTruckListItem, VendorType } from "@/lib/types";

type VendorFilter = "all" | VendorType;

const tabs: { id: VendorFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "truck", label: "Food Trucks" },
  { id: "cart_tent", label: "Carts & Tents" },
];

function vendorChipClass(active: boolean) {
  if (active) {
    return "rounded-full border border-[#D97A2B]/30 bg-white px-3 py-1 text-xs font-medium text-[#8f4f1c]";
  }
  return "rounded-full border border-[#1E1E1E]/15 bg-white px-3 py-1 text-xs font-medium text-[#1E1E1E]/80";
}

type FindFoodTrucksContentProps = {
  trucks: FoodTruckListItem[];
  cuisines: string[];
};

export function FindFoodTrucksContent({ trucks, cuisines }: FindFoodTrucksContentProps) {
  const [vendorFilter, setVendorFilter] = useState<VendorFilter>("all");

  const filteredTrucks = useMemo(() => {
    if (vendorFilter === "all") return trucks;
    return trucks.filter((t) => t.vendor_type === vendorFilter);
  }, [trucks, vendorFilter]);

  return (
    <>
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
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#1E1E1E]/70">Vendor type</p>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Vendor type">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={vendorFilter === tab.id}
                className={vendorChipClass(vendorFilter === tab.id)}
                onClick={() => setVendorFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#1E1E1E]/70">Cuisine Filters</p>
          <FilterChips filters={cuisines} />
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredTrucks.map((truck) => (
          <DirectoryTruckCard key={truck.slug} truck={truck} />
        ))}
      </section>
    </>
  );
}
