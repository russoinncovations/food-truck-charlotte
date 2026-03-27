import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { trucks } from "@/data/trucks";
import { getTruckBySlug } from "@/lib/data-access";

type TruckPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return trucks.map((truck) => ({ slug: truck.slug }));
}

export async function generateMetadata({ params }: TruckPageProps): Promise<Metadata> {
  const { slug } = await params;
  const truck = getTruckBySlug(slug);

  if (!truck) {
    return { title: "Truck Not Found" };
  }

  return {
    title: `${truck.name} in Charlotte`,
    description: `${truck.name} serves ${truck.cuisine} in ${truck.serviceArea}. View menu highlights and book this truck for your event.`,
  };
}

export default async function TruckPage({ params }: TruckPageProps) {
  const { slug } = await params;
  const truck = getTruckBySlug(slug);

  if (!truck) notFound();

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-[#1E1E1E]/10 bg-white p-7">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#D97A2B]">{truck.cuisine}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-[#1E1E1E] md:text-4xl">{truck.name}</h1>
        <p className="mt-3 text-sm text-[#1E1E1E]/75">
          <span className="font-medium">Service Area:</span> {truck.serviceArea}
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#1E1E1E]/85">{truck.shortBio}</p>
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
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-[#1E1E1E]/10 bg-white p-6">
          <h2 className="text-xl font-semibold text-[#1E1E1E]">Menu Highlights</h2>
          <ul className="mt-4 space-y-2 text-sm text-[#1E1E1E]/85">
            {truck.menuHighlights.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </article>
        <article className="rounded-2xl border border-[#1E1E1E]/10 bg-white p-6">
          <h2 className="text-xl font-semibold text-[#1E1E1E]">Event Types Served</h2>
          <ul className="mt-4 space-y-2 text-sm text-[#1E1E1E]/85">
            {truck.eventTypesServed.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
