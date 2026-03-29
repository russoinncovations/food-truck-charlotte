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
    <form
      action={formAction}
      method="post"
      encType="multipart/form-data"
      className="grid gap-4 rounded-2xl border border-[#1E1E1E]/8 bg-[#fffdfa] p-5 md:grid-cols-2 md:p-6"
    >
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

      <FormField
        label="Truck / Vendor Name"
        name="truckName"
        placeholder="Your public business name"
        required
      />
      <FormField label="Email" name="email" type="email" placeholder="name@email.com" required />

      <div className="md:col-span-2">
        <FormField
          label="What do you serve?"
          name="whatYouServe"
          as="textarea"
          placeholder="e.g. Street-style tacos with bold salsas and house-pickled toppings"
          required
          maxLength={160}
          helpText="One sentence, max 160 characters."
        />
      </div>

      <div className="md:col-span-2">
        <FormField
          label="Describe your business"
          name="vendorDescription"
          as="textarea"
          placeholder="Tell us about your food truck in 2-3 sentences"
          required
          maxLength={500}
          helpText="Max 500 characters."
        />
      </div>

      <div className="md:col-span-2">
        <FormField
          label="What neighborhoods or areas do you serve?"
          name="serviceArea"
          placeholder="e.g. South End, NoDa, Uptown, Matthews"
          required
        />
      </div>

      <div className="md:col-span-2">
        <fieldset className="min-w-0 border-0 p-0">
          <legend className="text-[15px] font-medium text-[#1E1E1E]">Do you offer catering?</legend>
          <div className="mt-2 space-y-3 rounded-xl border border-[#1E1E1E]/15 bg-[#fffdf9] px-4 py-3">
            <label className="flex cursor-pointer items-start gap-3 text-[15px] font-normal text-[#1E1E1E]">
              <input
                type="radio"
                name="catering"
                value="yes"
                required
                className="mt-1 h-4 w-4 shrink-0 border-[#1E1E1E]/25 accent-[#D97A2B] focus:outline-none focus:ring-2 focus:ring-[#D97A2B]"
              />
              <span>Yes</span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 text-[15px] font-normal text-[#1E1E1E]">
              <input
                type="radio"
                name="catering"
                value="no"
                className="mt-1 h-4 w-4 shrink-0 border-[#1E1E1E]/25 accent-[#D97A2B] focus:outline-none focus:ring-2 focus:ring-[#D97A2B]"
              />
              <span>No</span>
            </label>
          </div>
        </fieldset>
      </div>

      <div className="md:col-span-2">
        <FormField
          label="Instagram (optional)"
          name="instagram"
          placeholder="@yourtruckname"
          required={false}
        />
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

      <div className="md:col-span-2">
        <label className="block text-[15px] font-medium text-[#1E1E1E]">
          Upload a photo of your truck, cart, or tent (optional)
          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png"
            className="mt-2 block w-full cursor-pointer rounded-xl border border-[#1E1E1E]/15 bg-[#fffdf9] px-4 py-3 text-[15px] text-[#1E1E1E] outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-[#f9f4ec] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#1E1E1E] focus:ring-2 focus:ring-[#D97A2B]"
          />
        </label>
        <span className="mt-1 block text-[13px] font-normal leading-5 text-[#1E1E1E]/60">
          JPEG or PNG, max 5MB
        </span>
      </div>

      <SubmitButton isPending={isPending}>Join the Directory</SubmitButton>
    </form>
  );
}
