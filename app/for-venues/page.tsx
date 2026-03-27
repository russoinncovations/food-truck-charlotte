import type { Metadata } from "next";
import { ForVenuesForm } from "@/components/forms/for-venues-form";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = {
  title: "For Venues and Hosts",
  description:
    "Host a food truck in Charlotte with practical support from Food Truck Charlotte and submit your venue inquiry in minutes.",
};

export default function ForVenuesPage() {
  return (
    <div className="space-y-10 md:space-y-12">
      <SectionHeader
        eyebrow="For Venues"
        title="Host Food Trucks with More Confidence"
        description="From breweries and churches to schools, offices, and neighborhoods, we help hosts connect with trusted local trucks for real-world events."
      />

      <section className="grid gap-4 rounded-2xl border border-[#1E1E1E]/8 bg-[#fffdfa] p-5 md:grid-cols-3 md:p-6">
        {[
          "Create a stronger event experience with well-loved local trucks.",
          "Give guests variety while supporting Charlotte small businesses.",
          "Share your details once and start with a clear inquiry process.",
        ].map((item) => (
          <p key={item} className="text-sm leading-6 text-[#1E1E1E]/85">
            {item}
          </p>
        ))}
      </section>

      <ForVenuesForm />
    </div>
  );
}
