import Image from "next/image";
import Link from "next/link";
import type { FoodTruckListItem } from "@/lib/types";

type TruckCardProps = {
  truck: FoodTruckListItem;
};

function serviceAreaParts(serviceArea: string): string[] {
  return serviceArea
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function nameInitial(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  return t.charAt(0).toUpperCase();
}

export function TruckCard({ truck }: TruckCardProps) {
  const cuisineForBadge = truck.cuisine?.trim();
  const showCuisineBadge = Boolean(cuisineForBadge && cuisineForBadge !== "General");
  const areas = serviceAreaParts(truck.serviceArea);
  const serviceAreaDisplay =
    areas.length > 0 ? areas.join(" · ") : truck.serviceArea.trim() || "—";

  return (
    <article className="flex w-full gap-4 rounded-xl border border-[#1E1E1E]/10 bg-[#fffdfa] p-4 shadow-sm">
      <div className="relative h-[120px] w-[120px] shrink-0 overflow-hidden rounded-lg bg-[#1a1a1a]">
        {truck.photoUrl ? (
          <Image
            src={truck.photoUrl}
            alt={`${truck.name} photo`}
            fill
            className="object-cover"
            sizes="120px"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#1a1a1a]" aria-hidden>
            <span className="select-none text-5xl font-semibold leading-none text-white/90">
              {nameInitial(truck.name)}
            </span>
          </div>
        )}
      </div>

      <div className="flex min-h-[120px] min-w-0 flex-1 flex-col">
        <h3 className="text-lg font-bold leading-snug text-[#1E1E1E]">{truck.name}</h3>
        {showCuisineBadge ? (
          <span className="mt-1.5 inline-flex w-fit rounded-full border border-[#D97A2B]/30 bg-[#fff4ea] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#8f4f1c]">
            {cuisineForBadge}
          </span>
        ) : null}
        <p className="mt-1.5 text-sm text-gray-500">{serviceAreaDisplay}</p>
        <div className="mt-auto flex justify-end pt-3">
          <Link
            href={`/trucks/${truck.slug}`}
            className="inline-flex shrink-0 rounded-full border border-[#1E1E1E]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1E1E1E] hover:bg-[#1E1E1E]/5"
          >
            View Truck
          </Link>
        </div>
      </div>
    </article>
  );
}
