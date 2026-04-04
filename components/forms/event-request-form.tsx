"use client";

import { useActionState } from "react";
import { submitEventRequest, type EventRequestState } from "@/app/actions/event-request";
import { FormField } from "@/components/form-field";
import { FormStatus } from "@/components/forms/form-status";
import { SubmitButton } from "@/components/forms/submit-button";

const initialState: EventRequestState = {};

export function EventRequestForm() {
  const [state, formAction, isPending] = useActionState(submitEventRequest, initialState);

  return (
    <form
      action={formAction}
      method="post"
      className="grid gap-4 rounded-2xl border border-[#1E1E1E]/8 bg-[#fffdfa] p-5 md:grid-cols-2 md:p-6"
    >
      <div className="md:col-span-2">
        <FormStatus
          state={state}
          successTitle="Your event request has been received."
          successDescription="Check your email for a confirmation. Registered food trucks may reach out to you directly about your event."
        />
      </div>

      <FormField label="Your name" name="hostName" placeholder="Full name" required />
      <FormField label="Email" name="hostEmail" type="email" placeholder="name@email.com" required />
      <div className="md:col-span-2">
        <FormField label="Phone" name="hostPhone" type="tel" placeholder="(704) 555-0123" required />
      </div>

      <FormField label="Event date" name="eventDate" type="date" required />
      <FormField
        label="Expected guest count"
        name="guestCount"
        type="number"
        placeholder="e.g. 75"
        required
      />

      <div className="md:col-span-2">
        <FormField
          label="Event location"
          name="eventLocation"
          placeholder="Venue name, neighborhood, or address"
          required
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-[15px] font-medium text-[#1E1E1E]">
          Indoor or outdoor
          <select
            name="indoorOutdoor"
            required
            className="mt-2 w-full rounded-xl border border-[#1E1E1E]/15 bg-[#fffdf9] px-4 py-3 text-[15px] text-[#1E1E1E] outline-none ring-[#D97A2B] focus:ring-2"
            defaultValue=""
          >
            <option value="" disabled>
              Select one
            </option>
            <option value="indoor">Indoor</option>
            <option value="outdoor">Outdoor</option>
            <option value="both">Both</option>
          </select>
        </label>
      </div>

      <div className="md:col-span-2">
        <FormField
          label="Cuisine preferences"
          name="cuisinePreferences"
          as="textarea"
          placeholder="e.g. Tacos, BBQ, vegetarian options…"
          required
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-[15px] font-medium text-[#1E1E1E]">
          Budget range{" "}
          <span className="font-normal text-[#1E1E1E]/60">(optional)</span>
          <select
            name="budgetRange"
            className="mt-2 w-full rounded-xl border border-[#1E1E1E]/15 bg-[#fffdf9] px-4 py-3 text-[15px] text-[#1E1E1E] outline-none ring-[#D97A2B] focus:ring-2"
            defaultValue=""
          >
            <option value="">Prefer not to say</option>
            <option value="under_500">Under $500</option>
            <option value="500_1000">$500–$1000</option>
            <option value="1000_2000">$1000–$2000</option>
            <option value="2000_plus">$2000+</option>
          </select>
        </label>
      </div>

      <SubmitButton isPending={isPending}>Submit Event Request</SubmitButton>
    </form>
  );
}
