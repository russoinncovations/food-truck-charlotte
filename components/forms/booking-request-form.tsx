"use client"

import { useActionState, useState } from "react"
import { submitBookingRequest, type BookingRequestResult } from "@/app/actions/submitBookingRequest"
import { FormField } from "@/components/forms/form-field"
import { SubmitButton } from "@/components/forms/submit-button"
import { AlertCircle } from "lucide-react"
import { BOOKING_REQUEST_TYPE, VENDOR_TYPE_OPTIONS } from "@/lib/booking/booking-request-constants"
import { cn } from "@/lib/utils"

type DirectoryTruck = { id: string; name: string }

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

const REQUEST_MODE_OPTIONS: { value: string; title: string; hint: string }[] = [
  {
    value: BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR,
    title: "A specific food truck/vendor",
    hint: "Pick a truck from our directory; they get your request directly.",
  },
  {
    value: BOOKING_REQUEST_TYPE.CUISINE_MATCH,
    title: "A vendor by cuisine/category",
    hint: "Tell us what you’re looking for and we’ll help match you.",
  },
  {
    value: BOOKING_REQUEST_TYPE.OPEN_REQUEST,
    title: "Any available food truck/cart/tent",
    hint: "Open to whoever’s available; our team will follow up.",
  },
]

export function BookingRequestForm({ directoryTrucks = [] }: { directoryTrucks?: DirectoryTruck[] }) {
  const [state, formAction, isPending] = useActionState(submitBookingRequest, initialState)
  const [requestType, setRequestType] = useState<string>(BOOKING_REQUEST_TYPE.OPEN_REQUEST)

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

      <input type="hidden" name="requestType" value={requestType} />

      {/* What are you looking for? — first visible section */}
      <section
        aria-labelledby="booking-path-heading"
        className="rounded-xl border-2 border-primary/20 bg-muted/40 p-5 md:p-6 space-y-5 shadow-sm"
      >
        <div>
          <h2 id="booking-path-heading" className="text-xl font-semibold text-foreground tracking-tight">
            What are you looking for?
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Choose one path. You can fill out the rest of the form below.
          </p>
        </div>

        <fieldset className="space-y-4 border-0 p-0 m-0">
          <legend className="sr-only">Booking request type</legend>
          <div className="grid gap-3">
            {REQUEST_MODE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  "flex gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                  requestType === opt.value
                    ? "border-primary bg-background shadow-sm"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <input
                  type="radio"
                  className="mt-1 h-4 w-4 shrink-0 text-primary"
                  checked={requestType === opt.value}
                  onChange={() => setRequestType(opt.value)}
                  aria-describedby={`hint-${opt.value}`}
                />
                <div>
                  <p className="font-semibold text-foreground">{opt.title}</p>
                  <p id={`hint-${opt.value}`} className="text-sm text-muted-foreground mt-0.5">
                    {opt.hint}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {requestType === BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR && (
            <div className="space-y-2 pt-1 border-t border-border/80">
              <label htmlFor="truckId" className="text-sm font-semibold text-foreground block">
                Which truck/vendor do you want? <span className="text-destructive">*</span>
              </label>
              <select
                id="truckId"
                name="truckId"
                required
                className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
                defaultValue=""
              >
                <option value="" disabled>
                  Select a truck or vendor…
                </option>
                {directoryTrucks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {directoryTrucks.length === 0 ? (
                <p className="text-sm text-destructive">
                  No trucks in the directory right now — try again later or choose another option above.
                </p>
              ) : null}
            </div>
          )}

          {(requestType === BOOKING_REQUEST_TYPE.CUISINE_MATCH ||
            requestType === BOOKING_REQUEST_TYPE.OPEN_REQUEST) && (
            <div className="space-y-2 pt-1 border-t border-border/80">
              <label htmlFor="vendorType" className="text-sm font-semibold text-foreground block">
                Vendor format
              </label>
              <p className="text-xs text-muted-foreground -mt-1">
                {requestType === BOOKING_REQUEST_TYPE.CUISINE_MATCH
                  ? "Truck, cart, tent, or any — helps us route your request."
                  : "Optional — tell us what kind of vendor you have in mind."}
              </p>
              <select
                id="vendorType"
                name="vendorType"
                className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
                defaultValue=""
              >
                <option value="">Any</option>
                {VENDOR_TYPE_OPTIONS.filter((o) => o.value !== "any").map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </fieldset>
      </section>

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

      {/* Preferences — cuisines not used for specific-vendor path */}
      {requestType !== BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR && (
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-foreground">
          {requestType === BOOKING_REQUEST_TYPE.CUISINE_MATCH ? "Cuisines / categories *" : "Food preferences (optional)"}
        </legend>
        {requestType === BOOKING_REQUEST_TYPE.CUISINE_MATCH ? (
          <p className="text-sm text-muted-foreground">Select at least one — required for a cuisine-based request.</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Optional — share what you like if it helps us match you.
          </p>
        )}
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
      )}

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
        <p className="mb-3 text-xs text-muted-foreground max-w-2xl">
          FoodTruckCLT is a connection platform. Vendors are independent, and all arrangements are
          handled directly between customers and vendors.
        </p>
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
