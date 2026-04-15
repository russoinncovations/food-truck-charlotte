"use client";

import { useActionState } from "react";
import { submitBookingRequest, type InquiryFormState } from "@/app/actions/inquiry";
import { FormField } from "@/components/form-field";
import { FormStatus } from "@/components/forms/form-status";
import { SubmitButton } from "@/components/forms/submit-button";

const initialState: InquiryFormState = {};

type BookingRequestFormProps = {
  truckSlug?: string;
};

export function BookingRequestForm({ truckSlug }: BookingRequestFormProps) {
  const [state, formAction, isPending] = useActionState(submitBookingRequest, initialState);

  return (
    <form action={formAction} method="post" className="grid gap-4 rounded-2xl border border-[#1E1E1E]/8 bg-[#fffdfa] p-5 md:grid-cols-2 md:p-6">
      <input type="hidden" name="truck" value={truckSlug ?? ""} />
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
      <div className="md:col-span-2">
        <fieldset className="min-w-0 border-0 p-0">
          <legend className="text-[15px] font-medium text-[#1E1E1E]">Cuisine interests</legend>
          <span className="mt-1 block text-[13px] font-normal leading-5 text-[#1E1E1E]/60">Select all that apply</span>
          <div className="mt-2 space-y-3 rounded-xl border border-[#1E1E1E]/15 bg-[#fffdf9] px-4 py-3">
            {[
              { value: "mexican", label: "Mexican / Latin" },
              { value: "bbq", label: "BBQ / smoked" },
              { value: "american", label: "American / burgers" },
              { value: "italian", label: "Italian / pizza" },
              { value: "asian", label: "Asian" },
              { value: "mediterranean", label: "Mediterranean" },
              { value: "soul_food", label: "Soul / comfort" },
              { value: "dessert", label: "Desserts" },
              { value: "coffee", label: "Coffee / café" },
            ].map(({ value, label }) => (
              <label key={value} className="flex cursor-pointer items-start gap-3 text-[15px] font-normal text-[#1E1E1E]">
                <input
                  type="checkbox"
                  name="cuisines"
                  value={value}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-[#1E1E1E]/25 accent-[#D97A2B] focus:outline-none focus:ring-2 focus:ring-[#D97A2B]"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
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

/** @deprecated Use {@link BookingRequestForm} */
export const BookATruckForm = BookingRequestForm;
