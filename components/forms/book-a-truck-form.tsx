"use client";

import { useActionState } from "react";
import { submitBookATruck, type InquiryFormState } from "@/app/actions/inquiry";
import { FormField } from "@/components/form-field";
import { FormStatus } from "@/components/forms/form-status";
import { SubmitButton } from "@/components/forms/submit-button";

const initialState: InquiryFormState = {};

export function BookATruckForm() {
  const [state, formAction, isPending] = useActionState(submitBookATruck, initialState);

  return (
    <form action={formAction} method="post" className="grid gap-4 rounded-2xl border border-[#1E1E1E]/8 bg-[#fffdfa] p-5 md:grid-cols-2 md:p-6">
      <div className="md:col-span-2">
        <FormStatus state={state} />
      </div>

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
      <SubmitButton isPending={isPending}>Send Inquiry</SubmitButton>
    </form>
  );
}
