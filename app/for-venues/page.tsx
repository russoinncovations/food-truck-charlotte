import type { Metadata } from "next";
import { FormField } from "@/components/form-field";
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

      <form className="grid gap-4 rounded-2xl border border-[#1E1E1E]/8 bg-[#fffdfa] p-5 md:grid-cols-2 md:p-6">
        <FormField label="Contact Name" name="contactName" placeholder="Your full name" required />
        <FormField label="Business / Venue Name" name="venueName" placeholder="Venue, HOA, school, or company name" required />
        <FormField label="Email" name="email" type="email" placeholder="name@email.com" required />
        <FormField label="Phone" name="phone" type="tel" placeholder="(704) 555-0123" />
        <FormField label="Event Type" name="eventType" placeholder="Ex: Neighborhood social, employee lunch, festival" />
        <FormField label="Event Date" name="eventDate" type="date" />
        <FormField label="Address" name="address" placeholder="Street address in Charlotte area" />
        <FormField label="Estimated Attendance" name="attendance" type="number" placeholder="Ex: 200" />
        <div className="md:col-span-2">
          <FormField
            label="Notes"
            name="notes"
            as="textarea"
            placeholder="Share schedule, space details, power access, and any truck preferences."
          />
        </div>
        <button
          type="submit"
          className="md:col-span-2 inline-flex w-fit rounded-full bg-[#D97A2B] px-6 py-3 text-sm font-semibold text-white hover:bg-[#c76e25]"
        >
          Send Host Inquiry
        </button>
      </form>
    </div>
  );
}
