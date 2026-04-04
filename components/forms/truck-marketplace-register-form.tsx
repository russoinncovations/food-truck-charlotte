"use client";

import { useActionState } from "react";
import { submitTruckRegistration, type TruckRegisterState } from "@/app/actions/truck-register";
import { FormField } from "@/components/form-field";
import { FormStatus } from "@/components/forms/form-status";
import { SubmitButton } from "@/components/forms/submit-button";

const initialState: TruckRegisterState = {};

export function TruckMarketplaceRegisterForm() {
  const [state, formAction, isPending] = useActionState(submitTruckRegistration, initialState);

  return (
    <form
      action={formAction}
      method="post"
      className="grid gap-4 rounded-2xl border border-[#1E1E1E]/8 bg-[#fffdfa] p-5 md:grid-cols-2 md:p-6"
    >
      <div className="md:col-span-2">
        <FormStatus
          state={state}
          successTitle="You are registered."
          successDescription="Sign in with the same email to open your dashboard and respond to event leads. You are not listed on the public directory until your profile is complete."
        />
      </div>

      <FormField label="Truck name" name="truckName" placeholder="Your public business name" required />
      <FormField label="Owner name" name="ownerName" placeholder="Contact person" required />
      <FormField label="Email" name="email" type="email" placeholder="name@email.com" required />
      <FormField label="Phone" name="phone" type="tel" placeholder="(704) 555-0123" required />

      <div className="md:col-span-2">
        <FormField
          label="Cuisine types"
          name="cuisineTypes"
          placeholder="e.g. Mexican, BBQ, coffee — comma separated"
          helpText="Separate multiple types with commas."
          required
        />
      </div>

      <div className="md:col-span-2">
        <FormField label="Instagram (optional)" name="instagram" placeholder="@yourtruck" required={false} />
      </div>

      <div className="md:col-span-2">
        <FormField
          label="Website (optional)"
          name="website"
          type="text"
          placeholder="https://yoursite.com"
          required={false}
        />
      </div>

      <SubmitButton isPending={isPending}>Register</SubmitButton>
    </form>
  );
}
