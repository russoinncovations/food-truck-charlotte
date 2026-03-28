import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { fetchActiveTruckBySlug } from "@/lib/truck-by-slug";

type TruckPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

function nameInitial(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  return t.charAt(0).toUpperCase();
}

function serviceAreaParts(serviceArea: string): string[] {
  return serviceArea
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function WebsiteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

export async function generateMetadata({ params }: TruckPageProps): Promise<Metadata> {
  const { slug } = await params;
  const truck = await fetchActiveTruckBySlug(slug);

  if (!truck) {
    return { title: "Truck Not Found" };
  }

  const area = truck.serviceArea.trim();
  const areaPart = area ? ` in ${area}` : "";
  return {
    title: `${truck.name} in Charlotte`,
    description: `${truck.name}. ${truck.cuisine}${areaPart}. View details and book for your event.`,
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
  const areas = serviceAreaParts(truck.serviceArea);
  const igHref = truck.instagram
    ? truck.instagram.startsWith("http")
      ? truck.instagram
      : `https://instagram.com/${truck.instagram.replace(/^@/, "")}`
    : null;
  const webHref = truck.website
    ? truck.website.startsWith("http")
      ? truck.website
      : `https://${truck.website}`
    : null;

  return (
    <div className="space-y-8">
      <div className="relative h-[280px] w-full overflow-hidden rounded-2xl border border-[#1E1E1E]/10 sm:rounded-3xl">
        {truck.photoUrl ? (
          <Image
            src={truck.photoUrl}
            alt={`${truck.name} photo`}
            fill
            className="object-cover"
            sizes="(max-width: 1152px) 100vw, 1152px"
            priority
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#faf7f2]">
            <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-[#c2601f]">
              <span className="text-[48px] font-bold leading-none text-white">{nameInitial(truck.name)}</span>
            </div>
          </div>
        )}
      </div>

      <section className="rounded-2xl border border-[#1E1E1E]/10 bg-white p-6 shadow-[0_8px_24px_rgba(30,30,30,0.04)] md:rounded-3xl md:p-8">
        <p
          className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#D97A2B]"
          style={{ fontVariant: "small-caps" }}
        >
          {truck.cuisine}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-[#1E1E1E] md:text-4xl">{truck.name}</h1>

        {desc ? <p className="mt-4 max-w-3xl text-[15px] leading-7 text-[#1E1E1E]/65">{desc}</p> : null}

        {areas.length > 0 ? (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-[#1E1E1E]">Serves:</span>
            {areas.map((area) => (
              <span
                key={area}
                className="rounded-full border border-[#D97A2B]/45 bg-[#fff4ea] px-2.5 py-1 text-xs font-semibold text-[#c2601f]"
              >
                {area}
              </span>
            ))}
          </div>
        ) : null}

        {truck.catering ? (
          <p className="mt-4">
            <span className="inline-flex rounded-full border border-emerald-600/25 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              ✓ Catering Available
            </span>
          </p>
        ) : null}

        {(igHref || webHref) ? (
          <div className="mt-6 flex flex-wrap gap-4">
            {igHref ? (
              <a
                href={igHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#1E1E1E] underline decoration-[#D97A2B]/50 underline-offset-4 hover:text-[#D97A2B]"
              >
                <InstagramIcon className="h-5 w-5 shrink-0 text-[#D97A2B]" />
                Instagram
              </a>
            ) : null}
            {webHref ? (
              <a
                href={webHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#1E1E1E] underline decoration-[#D97A2B]/50 underline-offset-4 hover:text-[#D97A2B]"
              >
                <WebsiteIcon className="h-5 w-5 shrink-0 text-[#D97A2B]" />
                Website
              </a>
            ) : null}
          </div>
        ) : null}
      </section>

      <div className="flex flex-col gap-3">
        <Link
          href="/book-a-truck"
          className="inline-flex w-full items-center justify-center rounded-full bg-[#D97A2B] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#c76e25]"
        >
          Book This Truck
        </Link>
        <Link
          href="/find-food-trucks"
          className="inline-flex w-full items-center justify-center rounded-full border border-[#1E1E1E]/25 bg-white px-6 py-3 text-sm font-semibold text-[#1E1E1E] transition-colors hover:bg-[#1E1E1E]/5"
        >
          Browse All Vendors
        </Link>
      </div>
    </div>
  );
}
