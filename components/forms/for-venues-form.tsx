"use client";

import { useActionState } from "react";
import { submitForVenues, type InquiryFormState } from "@/app/actions/inquiry";
import { FormField } from "@/components/form-field";
import { FormStatus } from "@/components/forms/form-status";
import { SubmitButton } from "@/components/forms/submit-button";

const initialState: InquiryFormState = {};

export function ForVenuesForm() {
  const [state, formAction, isPending] = useActionState(submitForVenues, initialState);

  return (
    <form action={formAction} method="post" className="grid gap-4 rounded-2xl border border-[#1E1E1E]/8 bg-[#fffdfa] p-5 md:grid-cols-2 md:p-6">
      <div className="md:col-span-2">
        <FormStatus state={state} />
      </div>

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
      <SubmitButton isPending={isPending}>Send Host Inquiry</SubmitButton>
    </form>
  );
}
