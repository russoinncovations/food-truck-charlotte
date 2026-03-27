import type { Metadata } from "next";
import { ForTrucksForm } from "@/components/forms/for-trucks-form";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = {
  title: "For Food Vendor Owners",
  description:
    "Join Food Truck Charlotte to increase local visibility, receive qualified inquiries, and grow through trusted community reach.",
};

export default function ForTrucksPage() {
  return (
    <div className="space-y-10 md:space-y-12">
      <SectionHeader
        eyebrow="For Trucks"
        title="Grow Your Visibility with Food Truck Charlotte"
        description="Join a Charlotte-first guide built from real community relationships, and get discovered by people actively planning where to eat and who to book."
      />

      <section className="grid gap-4 rounded-2xl border border-[#1E1E1E]/8 bg-[#fffdfa] p-5 md:grid-cols-3 md:p-6">
        {[
          "Show up where Charlotte locals already go to discover food vendors.",
          "Build trust through consistent local visibility and event coverage.",
          "Receive inquiries from hosts planning schools, HOAs, offices, and more.",
        ].map((item) => (
          <p key={item} className="text-sm leading-6 text-[#1E1E1E]/85">
            {item}
          </p>
        ))}
      </section>

      <ForTrucksForm />
    </div>
  );
}
