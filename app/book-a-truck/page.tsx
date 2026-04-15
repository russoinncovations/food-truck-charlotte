import type { Metadata } from "next";
import { BookingRequestForm } from "@/components/forms/book-a-truck-form";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = {
  title: "Book a Food Truck in Charlotte",
  description:
    "Submit a food truck inquiry for your Charlotte event and share details so we can help connect you with a good fit.",
};

export default async function BookATruckPage({
  searchParams,
}: {
  searchParams: Promise<{ truck?: string }>;
}) {
  const sp = await searchParams;
  const truckSlug = typeof sp.truck === "string" ? sp.truck : undefined;

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

      <BookingRequestForm truckSlug={truckSlug} />
    </div>
  );
}
