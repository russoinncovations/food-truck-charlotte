import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { fetchActiveTruckBySlug } from "@/lib/truck-by-slug";

type TruckPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: TruckPageProps): Promise<Metadata> {
  const { slug } = await params;
  const truck = await fetchActiveTruckBySlug(slug);

  if (!truck) {
    return { title: "Truck Not Found" };
  }

  const area = truck.serviceArea.trim() || "Charlotte";
  return {
    title: `${truck.name} in Charlotte`,
    description: `${truck.name} — ${truck.cuisine} in ${area}. View details and book for your event.`,
  };
}

export default async function TruckPage({ params }: TruckPageProps) {
  const { slug } = await params;
  const truck = await fetchActiveTruckBySlug(slug);

  if (!truck) {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1E1E1E]">Truck not found</h1>
        <p className="text-[15px] leading-7 text-[#1E1E1E]/75">
          We couldn&apos;t find an active listing for that link.
        </p>
        <Link
          href="/find-food-trucks"
          className="inline-block text-[15px] font-semibold text-[#D97A2B] underline decoration-[#D97A2B]/50 underline-offset-4 hover:text-[#c76e25]"
        >
          Find Food Vendors
        </Link>
      </div>
    );
  }

  const desc = truck.description.trim();
  const area = truck.serviceArea.trim();

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-[#1E1E1E]/10 bg-white p-7">
        {truck.photoUrl ? (
          <div className="relative mb-6 aspect-[16/10] w-full max-w-3xl overflow-hidden rounded-2xl border border-[#1E1E1E]/10">
            <Image
              src={truck.photoUrl}
              alt={`${truck.name} photo`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 48rem"
              unoptimized
            />
          </div>
        ) : null}
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#D97A2B]">{truck.cuisine}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-[#1E1E1E] md:text-4xl">{truck.name}</h1>
        <p className="mt-3 text-sm text-[#1E1E1E]/75">
          <span className="font-medium">Service Area:</span> {area || "—"}
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#1E1E1E]/85">{desc || "—"}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/book-a-truck"
            className="inline-flex rounded-full bg-[#D97A2B] px-6 py-3 text-sm font-semibold text-white hover:bg-[#c76e25]"
          >
            Book This Truck
          </Link>
          <Link
            href="/about"
            className="inline-flex rounded-full border border-[#1E1E1E]/25 px-6 py-3 text-sm font-semibold text-[#1E1E1E] hover:bg-[#1E1E1E]/5"
          >
            Join the Community
          </Link>
          {truck.website ? (
            <a
              href={truck.website.startsWith("http") ? truck.website : `https://${truck.website}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full border border-[#1E1E1E]/25 px-6 py-3 text-sm font-semibold text-[#1E1E1E] hover:bg-[#1E1E1E]/5"
            >
              Website
            </a>
          ) : null}
          {truck.instagram ? (
            <a
              href={
                truck.instagram.startsWith("http")
                  ? truck.instagram
                  : `https://instagram.com/${truck.instagram.replace(/^@/, "")}`
              }
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full border border-[#1E1E1E]/25 px-6 py-3 text-sm font-semibold text-[#1E1E1E] hover:bg-[#1E1E1E]/5"
            >
              Instagram
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
}
