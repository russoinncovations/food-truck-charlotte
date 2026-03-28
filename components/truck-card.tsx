import Image from "next/image";
import Link from "next/link";
import type { FoodTruckListItem } from "@/lib/types";

type TruckCardProps = {
  truck: FoodTruckListItem;
};

export function TruckCard({ truck }: TruckCardProps) {
  return (
    <article className="rounded-2xl border border-[#1E1E1E]/10 bg-[#fffdfa] p-5 shadow-[0_8px_24px_rgba(30,30,30,0.04)]">
      {truck.photoUrl ? (
        <div className="relative mb-4 aspect-[16/10] w-full overflow-hidden rounded-xl border border-[#1E1E1E]/10">
          <Image
            src={truck.photoUrl}
            alt={`${truck.name} photo`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
          />
        </div>
      ) : null}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-[#1E1E1E]/12 bg-[#f9f4ec] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#1E1E1E]/70">
          Charlotte Pick
        </span>
        <span className="rounded-full border border-[#D97A2B]/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#8f4f1c]">
          {truck.cuisine}
        </span>
      </div>
      <h3 className="mb-2 text-[1.35rem] leading-tight font-semibold text-[#1E1E1E]">{truck.name}</h3>
      <p className="mb-4 text-[15px] leading-7 text-[#1E1E1E]/80">{truck.description}</p>
      <p className="mb-5 text-[15px] text-[#1E1E1E]/70">
        <span className="font-medium">Service Area:</span> {truck.serviceArea}
      </p>
      <Link
        href={`/trucks/${truck.slug}`}
        className="inline-flex rounded-full border border-[#1E1E1E]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1E1E1E] hover:bg-[#1E1E1E]/5"
      >
        View Truck
      </Link>
    </article>
  );
}
