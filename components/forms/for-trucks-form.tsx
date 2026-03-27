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

      <div className="md:col-span-2">
        <fieldset className="min-w-0 border-0 p-0">
          <legend className="text-[15px] font-medium text-[#1E1E1E]">What type of vendor are you?</legend>
          <span className="mt-1 block text-[13px] font-normal leading-5 text-[#1E1E1E]/60">Select all that apply</span>
          <div className="mt-2 space-y-3 rounded-xl border border-[#1E1E1E]/15 bg-[#fffdf9] px-4 py-3">
            <label className="flex cursor-pointer items-start gap-3 text-[15px] font-normal text-[#1E1E1E]">
              <input
                type="checkbox"
                name="vendorType"
                value="food_truck"
                className="mt-1 h-4 w-4 shrink-0 rounded border-[#1E1E1E]/25 accent-[#D97A2B] focus:outline-none focus:ring-2 focus:ring-[#D97A2B]"
              />
              <span>Food Truck</span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 text-[15px] font-normal text-[#1E1E1E]">
              <input
                type="checkbox"
                name="vendorType"
                value="food_cart"
                className="mt-1 h-4 w-4 shrink-0 rounded border-[#1E1E1E]/25 accent-[#D97A2B] focus:outline-none focus:ring-2 focus:ring-[#D97A2B]"
              />
              <span>Food Cart</span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 text-[15px] font-normal text-[#1E1E1E]">
              <input
                type="checkbox"
                name="vendorType"
                value="tent_pop_up"
                className="mt-1 h-4 w-4 shrink-0 rounded border-[#1E1E1E]/25 accent-[#D97A2B] focus:outline-none focus:ring-2 focus:ring-[#D97A2B]"
              />
              <span>Tent / Pop-Up</span>
            </label>
          </div>
        </fieldset>
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
