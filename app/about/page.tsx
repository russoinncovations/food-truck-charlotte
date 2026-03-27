import type { Metadata } from "next";
import { SectionHeader } from "@/components/section-header";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Built from Charlotte's Largest Food Truck Community",
  description:
    "Food Truck Charlotte began in 2019 as a Facebook group and grew into the region's largest food truck community — now a free directory at foodtruckclt.com.",
};

export default function AboutPage() {
  return (
    <div className="space-y-10 md:space-y-12">
      <SectionHeader title="Built from Charlotte's Largest Food Truck Community" />

      <section className="rounded-2xl border border-[#1E1E1E]/8 bg-[#fffdfa] p-6 md:p-7">
        <div className="max-w-2xl space-y-4 text-base leading-7 text-[#1E1E1E]/85">
          <p>
            {`Food Truck Charlotte started in 2019 as a simple Facebook group with one idea: Charlotte's food truck scene deserved a real community.`}
          </p>
          <p>
            {`Six years later, we're 35,000+ members strong — the largest food truck community in the Charlotte region.`}
          </p>
          <p>
            {`I created this group, built this site, and continue to grow both because I've seen firsthand what happens when the right people find the right food. Trucks find loyal customers. Neighbors discover their new favorites. Events come alive.`}
          </p>
          <p>
            {`foodtruckclt.com is the next step — a free directory built from this community, for this community. A place where good trucks don't fall through the cracks.`}
          </p>
          <p>{`We're just getting started.`}</p>
        </div>
        <p className="mt-8 text-base leading-7 text-[#1E1E1E]/85">
          — Nicole Russo
          <br />
          <span className="text-[#1E1E1E]/80">Founder, Food Truck Charlotte</span>
        </p>
        <p className="mt-6">
          <a
            href={site.facebookGroupUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[15px] font-semibold text-[#1E1E1E] underline decoration-[#D97A2B]/60 underline-offset-4"
          >
            Join the Facebook community → facebook.com/groups/foodtruckcharlotte
          </a>
        </p>
      </section>
    </div>
  );
}
