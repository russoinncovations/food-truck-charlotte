import type { Metadata } from "next";
import { FormField } from "@/components/form-field";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = {
  title: "Book a Food Truck in Charlotte",
  description:
    "Submit a food truck inquiry for your Charlotte event and share details so we can help connect you with a good fit.",
};

export default function BookATruckPage() {
  return (
    <div className="space-y-10 md:space-y-12">
      <SectionHeader
        eyebrow="Booking Inquiry"
        title="Book a Truck for Your Charlotte Event"
        description="Share your event details and preferences. We use this information to guide your inquiry toward trucks that match your goals, size, and location."
      />

      <p className="rounded-xl border border-[#D97A2B]/20 bg-[#fff4ea] p-4 text-sm leading-6 text-[#7a4318]">
        This is an inquiry form, not an instant booking confirmation. We recommend submitting early for the best availability.
      </p>

      <form className="grid gap-4 rounded-2xl border border-[#1E1E1E]/8 bg-[#fffdfa] p-5 md:grid-cols-2 md:p-6">
        <FormField label="Name" name="name" placeholder="Your full name" required />
        <FormField label="Email" name="email" type="email" placeholder="name@email.com" required />
        <FormField label="Phone" name="phone" type="tel" placeholder="(704) 555-0123" />
        <FormField
          label="Event Type"
          name="eventType"
          placeholder="HOA social, school night, office lunch..."
          helpText="Tell us what kind of event you are planning."
          required
        />
        <FormField label="Date" name="date" type="date" />
        <FormField label="Location" name="location" placeholder="Neighborhood or venue address" />
        <FormField label="Estimated Attendance" name="attendance" type="number" placeholder="Ex: 120" />
        <FormField label="Cuisine Preference" name="cuisinePreference" placeholder="Optional: tacos, BBQ, coffee..." />
        <div className="md:col-span-2">
          <FormField
            label="Notes"
            name="notes"
            as="textarea"
            placeholder="Share timing, budget range, setup details, or anything helpful for matching."
          />
        </div>
        <button
          type="submit"
          className="md:col-span-2 inline-flex w-fit rounded-full bg-[#D97A2B] px-6 py-3 text-sm font-semibold text-white hover:bg-[#c76e25]"
        >
          Send Inquiry
        </button>
      </form>
    </div>
  );
}
