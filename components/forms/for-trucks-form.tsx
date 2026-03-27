"use client";

import { useActionState } from "react";
import { submitForTrucks, type InquiryFormState } from "@/app/actions/inquiry";
import { FormField } from "@/components/form-field";
import { FormStatus } from "@/components/forms/form-status";
import { SubmitButton } from "@/components/forms/submit-button";

const initialState: InquiryFormState = {};

export function ForTrucksForm() {
  const [state, formAction, isPending] = useActionState(submitForTrucks, initialState);

  return (
    <form action={formAction} method="post" className="grid gap-4 rounded-2xl border border-[#1E1E1E]/8 bg-[#fffdfa] p-5 md:grid-cols-2 md:p-6">
      <div className="md:col-span-2">
        <FormStatus state={state} />
      </div>

      <FormField label="Truck Name" name="truckName" placeholder="Your truck's public name" required />
      <FormField label="Owner / Contact Name" name="contactName" placeholder="Best point of contact" required />
      <FormField label="Email" name="email" type="email" placeholder="name@email.com" required />
      <FormField label="Phone" name="phone" type="tel" placeholder="(704) 555-0123" />
      <FormField label="Cuisine" name="cuisine" placeholder="Ex: Tacos, BBQ, Caribbean" required />
      <FormField label="Service Area" name="serviceArea" placeholder="Ex: Uptown, South End, NoDa" required />
      <FormField label="Instagram" name="instagram" placeholder="@yourtruckname" />
      <FormField label="Website" name="website" placeholder="https://yourtruck.com" />
      <div className="md:col-span-2">
        <FormField
          label="Short Description"
          name="description"
          as="textarea"
          placeholder="Tell Charlotte what makes your menu and service style stand out."
        />
      </div>
      <SubmitButton isPending={isPending}>Join the Directory</SubmitButton>
    </form>
  );
}
