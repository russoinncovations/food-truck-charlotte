"use client"

import { FormEvent } from "react"
import { FormField } from "@/components/forms/form-field"
import { SubmitButton } from "@/components/forms/submit-button"
import { AlertCircle } from "lucide-react"

const cuisineOptions = [
  "Mexican / Tacos",
  "BBQ / Smokehouse",
  "American / Burgers",
  "Asian Fusion",
  "Southern / Soul Food",
  "Desserts / Sweets",
  "Pizza",
  "Seafood",
  "Mediterranean",
  "Vegetarian / Vegan",
  "Other",
]

type VendorSignupFormProps = {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void | Promise<void>
  submitError: string | null
  isSubmitting: boolean
}

export function VendorSignupForm({ onSubmit, submitError, isSubmitting }: VendorSignupFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {submitError && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Submission Failed</p>
            <p className="text-sm text-destructive/80 mt-1">{submitError}</p>
          </div>
        </div>
      )}

      {/* Vendor Type */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-foreground">
          What type of vendor are you?
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { value: "food_truck", label: "Food Truck" },
            { value: "food_trailer", label: "Food Trailer" },
            { value: "cart_tent", label: "Cart / Tent" },
          ].map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:border-primary/50 cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                name="vendorType"
                value={option.value}
                required
                className="h-4 w-4 text-primary focus:ring-primary"
              />
              <span className="font-medium text-foreground">{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Business Info */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-foreground">
          Business Information
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Truck / Business Name"
            name="business_name"
            required
            placeholder="e.g., Taco Loco"
          />
          <FormField
            label="Owner Name"
            name="contact_name"
            required
            placeholder="Your full name"
          />
        </div>
        <FormField
          label="Describe your food and style"
          name="vendor_description"
          as="textarea"
          placeholder="Tell us about your menu, specialties, and what makes you unique..."
          rows={3}
        />
      </fieldset>

      {/* Contact Info */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-foreground">
          Contact Information
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
          />
          <FormField
            label="Phone"
            name="phone"
            type="tel"
            placeholder="(704) 555-1234"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Website"
            name="website"
            type="url"
            placeholder="https://yoursite.com"
          />
          <FormField
            label="Instagram"
            name="instagram"
            placeholder="@yourtruck"
          />
        </div>
      </fieldset>

      {/* Cuisine Type */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-foreground">
          Cuisine Type
        </legend>
        <p className="text-sm text-muted-foreground">Select all that apply</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {cuisineOptions.map((cuisine) => (
            <label
              key={cuisine}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/50 cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="checkbox"
                name="cuisine_types"
                value={cuisine}
                className="h-4 w-4 rounded text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">{cuisine}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <FormField
        label="How long have you been in business?"
        name="yearsInBusiness"
        as="select"
      >
        <option value="">Select...</option>
        <option value="0">Just starting out</option>
        <option value="1">Less than 1 year</option>
        <option value="2">1-2 years</option>
        <option value="3">3-5 years</option>
        <option value="5">5+ years</option>
      </FormField>

      {/* Submit */}
      <div className="pt-4 border-t">
        <SubmitButton className="w-full sm:w-auto" isPending={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </SubmitButton>
        <p className="mt-3 text-sm text-muted-foreground">
          We review applications within 2-3 business days. You&apos;ll receive an email once approved.
        </p>
      </div>
    </form>
  )
}
