import type { Metadata } from "next";
import { EventRequestForm } from "@/components/forms/event-request-form";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = {
  title: "Request food trucks for your event",
  description:
    "Submit an open event request. Registered Charlotte food trucks can view your lead and reach out directly.",
};

export default function EventRequestPage() {
  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeader
        eyebrow="Event marketplace"
        title="List your event"
        description="Tell us about your gathering. We will save your request and share it with registered vendors on Food Truck Charlotte. Trucks contact you directly — we do not book or guarantee availability."
      />
      <EventRequestForm />
    </div>
  );
}
