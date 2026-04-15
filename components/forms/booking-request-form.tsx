"use client"

import { useActionState } from "react"
import { submitBookingRequest, type BookingRequestResult } from "@/app/actions/submitBookingRequest"
import { FormField } from "@/components/forms/form-field"
import { SubmitButton } from "@/components/forms/submit-button"
import { AlertCircle } from "lucide-react"

const eventTypes = [
  { value: "corporate", label: "Corporate Event" },
  { value: "private_party", label: "Private Party" },
  { value: "wedding", label: "Wedding" },
  { value: "brewery", label: "Brewery / Taproom" },
  { value: "festival", label: "Festival / Fair" },
  { value: "community", label: "Community Event" },
  { value: "other", label: "Other" },
]

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
]

const dietaryOptions = [
  "Vegetarian options",
  "Vegan options",
  "Gluten-free options",
  "Nut-free options",
  "Halal",
  "Kosher",
]

const budgetRanges = [
  { value: "under_500", label: "Under $500" },
  { value: "500_1000", label: "$500 - $1,000" },
  { value: "1000_2500", label: "$1,000 - $2,500" },
  { value: "2500_5000", label: "$2,500 - $5,000" },
  { value: "over_5000", label: "$5,000+" },
  { value: "flexible", label: "Flexible / Not sure" },
]

const initialState: BookingRequestResult | null = null

export function BookingRequestForm() {
  const [state, formAction, isPending] = useActionState(submitBookingRequest, initialState)

  return (
    <form action={formAction} className="space-y-8">
      {/* Error Display */}
      {state?.error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Submission Failed</p>
            <p className="text-sm text-destructive/80 mt-1">{state.error}</p>
          </div>
        </div>
      )}

      {/* Event Details */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-foreground">
          Event Details
        </legend>
        <FormField
          label="Event Type"
          name="eventType"
          as="select"
          required
        >
          <option value="">Select event type...</option>
          {eventTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </FormField>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="Event Date"
            name="eventDate"
            type="date"
            required
          />
          <FormField
            label="Start Time"
            name="startTime"
            type="time"
            required
          />
          <FormField
            label="End Time"
            name="endTime"
            type="time"
            required
          />
        </div>
        <FormField
          label="Expected Guest Count"
          name="guestCount"
          type="number"
          required
          placeholder="e.g., 100"
          min={1}
        />
      </fieldset>

      {/* Location */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-foreground">
          Event Location
        </legend>
        <FormField
          label="Venue Name"
          name="venueName"
          placeholder="e.g., Romare Bearden Park"
        />
        <FormField
          label="Street Address"
          name="streetAddress"
          required
          placeholder="123 Main St"
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-2">
            <FormField
              label="City"
              name="city"
              required
              placeholder="Charlotte"
            />
          </div>
          <FormField
            label="State"
            name="state"
            as="select"
          >
            <option value="NC">NC</option>
            <option value="SC">SC</option>
          </FormField>
          <FormField
            label="Zip Code"
            name="zipCode"
            required
            placeholder="28202"
          />
        </div>
      </fieldset>

      {/* Preferences */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-foreground">
          Food Preferences
        </legend>
        <p className="text-sm text-muted-foreground">What cuisines are you interested in? (Select all that apply)</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {cuisineOptions.map((cuisine) => (
            <label
              key={cuisine}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/50 cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="checkbox"
                name="cuisines"
                value={cuisine}
                className="h-4 w-4 rounded text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">{cuisine}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Dietary Requirements */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-foreground">
          Dietary Requirements
        </legend>
        <p className="text-sm text-muted-foreground">Any dietary accommodations needed? (Optional)</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {dietaryOptions.map((option) => (
            <label
              key={option}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/50 cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="checkbox"
                name="dietaryRequirements"
                value={option}
                className="h-4 w-4 rounded text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">{option}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Budget */}
      <FormField
        label="Budget Range"
        name="budgetRange"
        as="select"
      >
        <option value="">Select budget range...</option>
        {budgetRanges.map((range) => (
          <option key={range.value} value={range.value}>
            {range.label}
          </option>
        ))}
      </FormField>

      {/* Contact Info */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-foreground">
          Contact Information
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Your Name"
            name="contactName"
            required
            placeholder="Full name"
          />
          <FormField
            label="Organization / Company"
            name="organization"
            placeholder="Optional"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Email"
            name="contactEmail"
            type="email"
            required
            placeholder="you@example.com"
          />
          <FormField
            label="Phone"
            name="contactPhone"
            type="tel"
            required
            placeholder="(704) 555-1234"
          />
        </div>
      </fieldset>

      {/* Additional Notes */}
      <FormField
        label="Additional Notes"
        name="additionalNotes"
        as="textarea"
        placeholder="Any other details about your event, specific trucks you'd like, etc."
        rows={4}
      />

      {/* Submit */}
      <div className="pt-4 border-t">
        <SubmitButton className="w-full sm:w-auto" isPending={isPending}>
          {isPending ? "Submitting..." : "Submit Booking Request"}
        </SubmitButton>
        <p className="mt-3 text-sm text-muted-foreground">
          We&apos;ll review your request and connect you with available trucks within 1-2 business days.
        </p>
      </div>
    </form>
  )
}
