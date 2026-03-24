import type { Metadata } from "next";
import { CtaButton } from "@/components/cta-button";
import { SectionHeader } from "@/components/section-header";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Charlotte Food Truck Community",
  description:
    "Join the Food Truck Charlotte community on Facebook and Instagram for local updates, event announcements, and trusted recommendations.",
};

export default function CommunityPage() {
  return (
    <div className="space-y-10 md:space-y-12">
      <SectionHeader
        eyebrow="Community"
        title="Stay Connected to Charlotte’s Food Truck Scene"
        description="Follow along for local truck updates, upcoming events, and practical recommendations from people who know Charlotte."
      />

      <section className="rounded-2xl border border-[#1E1E1E]/8 bg-[#fffdfa] p-6 md:p-7">
        <p className="mb-4 inline-flex rounded-full border border-[#D97A2B]/25 bg-[#fff4ea] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#8f4f1c]">
          Community-backed in Charlotte
        </p>
        <p className="max-w-2xl text-base leading-7 text-[#1E1E1E]/85">
          Food Truck Charlotte grew from a large local Facebook group where neighbors share truck sightings, event tips,
          and honest recommendations. This site brings that same community trust into a cleaner, easier experience.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={site.facebookGroupUrl} target="_blank" rel="noreferrer">
            <span className="inline-flex rounded-full bg-[#D97A2B] px-6 py-3 text-sm font-semibold text-white hover:bg-[#c76e25]">
              Join the Facebook Group
            </span>
          </a>
          <a href={site.instagramUrl} target="_blank" rel="noreferrer">
            <span className="inline-flex rounded-full border border-[#1E1E1E]/25 px-6 py-3 text-sm font-semibold text-[#1E1E1E] hover:bg-[#1E1E1E]/5">
              Follow on Instagram
            </span>
          </a>
        </div>
      </section>

      <section className="rounded-2xl border border-[#1E1E1E]/8 bg-[#fffdfa] p-6 md:p-7">
        <h2 className="text-[1.35rem] font-semibold leading-tight text-[#1E1E1E]">Start Exploring Charlotte Trucks</h2>
        <p className="mt-2 text-[15px] leading-7 text-[#1E1E1E]/80">
          Browse trucks, check upcoming events, and keep this as your go-to local guide.
        </p>
        <div className="mt-4">
          <CtaButton href="/find-food-trucks">Find Food Trucks</CtaButton>
        </div>
      </section>
    </div>
  );
}
