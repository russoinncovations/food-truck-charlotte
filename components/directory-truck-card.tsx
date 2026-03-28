import Image from "next/image";
import Link from "next/link";
import type { FoodTruckListItem } from "@/lib/types";

type DirectoryTruckCardProps = {
  truck: FoodTruckListItem;
};

function serviceAreaParts(serviceArea: string): string[] {
  return serviceArea
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function DirectoryTruckCard({ truck }: DirectoryTruckCardProps) {
  const desc = truck.description.trim();
  const areas = serviceAreaParts(truck.serviceArea);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#1E1E1E]/10 bg-[#fffdfa] shadow-[0_8px_24px_rgba(30,30,30,0.04)]">
      <div className="relative h-[180px] w-full shrink-0 overflow-hidden rounded-t-xl">
        {truck.photoUrl ? (
          <Image
            src={truck.photoUrl}
            alt={`${truck.name} photo`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-gradient-to-b from-[#c2601f] to-[#3d1f0a]"
            aria-hidden
          >
            <span className="text-5xl leading-none text-white">🚚</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#1E1E1E]/12 bg-[#f9f4ec] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#1E1E1E]/70">
            {truck.vendor_type === "cart_tent" ? "CART & TENT" : "FOOD TRUCK"}
          </span>
          <span className="rounded-full border border-[#D97A2B]/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#8f4f1c]">
            {truck.cuisine}
          </span>
          {truck.catering === true ? (
            <span className="rounded-full border border-emerald-600/25 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
              ✓ Catering Available
            </span>
          ) : null}
        </div>

        <h3 className="text-xl font-semibold leading-tight tracking-tight text-[#1E1E1E]">{truck.name}</h3>

        {desc ? (
          <p className="mt-2 line-clamp-2 text-[15px] leading-6 text-[#1E1E1E]/60">{desc}</p>
        ) : null}

        {areas.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {areas.map((area) => (
              <span
                key={area}
                className="rounded-full border border-[#D97A2B]/35 bg-[#fff4ea] px-2.5 py-0.5 text-[11px] font-medium text-[#8f4f1c]"
              >
                {area}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto pt-5">
          <Link
            href={`/trucks/${truck.slug}`}
            className="flex w-full items-center justify-center rounded-full bg-[#D97A2B] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#c76e25]"
          >
            View Truck
          </Link>
        </div>
      </div>
    </article>
  );
}
