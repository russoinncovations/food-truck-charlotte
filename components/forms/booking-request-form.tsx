"use client"

import { useActionState, useState } from "react"
import { submitBookingRequest, type BookingRequestResult } from "@/app/actions/submitBookingRequest"
import { FormField } from "@/components/forms/form-field"
import { SubmitButton } from "@/components/forms/submit-button"
import { AlertCircle } from "lucide-react"
import { BOOKING_REQUEST_TYPE } from "@/lib/booking/booking-request-constants"
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

const budgetRanges = [
  { value: "under_500", label: "Under $500" },
  { value: "500_1000", label: "$500 - $1,000" },
  { value: "1000_2500", label: "$1,000 - $2,500" },
  { value: "2500_5000", label: "$2,500 - $5,000" },
  { value: "over_5000", label: "$5,000+" },
  { value: "flexible", label: "Flexible / Not sure" },
]

const initialState: BookingRequestResult | null = null

export function BookingRequestForm({
  directoryTrucks = [],
  preselectedTruckId = null,
}: {
  directoryTrucks?: DirectoryTruck[]
  preselectedTruckId?: string | null
}) {
  const [state, formAction, isPending] = useActionState(submitBookingRequest, initialState)
  const [showOptional, setShowOptional] = useState(false)
  const requestType = preselectedTruckId
    ? BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR
    : BOOKING_REQUEST_TYPE.OPEN_REQUEST

  return (
    <form action={formAction} className="space-y-8">
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
      {preselectedTruckId ? <input type="hidden" name="truckId" value={preselectedTruckId} /> : null}

      {preselectedTruckId && directoryTrucks.some((t) => t.id === preselectedTruckId) ? (
        <div className="rounded-lg border bg-muted/40 p-4 text-sm">
          <p className="font-medium text-foreground">Requesting a specific truck</p>
          <p className="text-muted-foreground mt-1">
            {directoryTrucks.find((t) => t.id === preselectedTruckId)?.name ?? "Selected truck"}
          </p>
        </div>
      ) : null}

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-foreground">Required event details</legend>
        <FormField label="Event Type" name="eventType" as="select" required>
          <option value="">Select event type...</option>
          {eventTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </FormField>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Event Date" name="eventDate" type="date" required />
          <FormField label="Start Time" name="startTime" type="time" required />
          <FormField label="End Time" name="endTime" type="time" required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Estimated Guest Count"
            name="guestCount"
            type="number"
            required
            placeholder="e.g., 100"
            min={1}
          />
          <FormField
            label="Number of Trucks Needed"
            name="trucksNeeded"
            type="number"
            required
            placeholder="e.g., 2"
            min={1}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-foreground">Event location</legend>
        <FormField label="Venue Name" name="venueName" placeholder="e.g., Romare Bearden Park" />
        <FormField label="Street Address" name="streetAddress" required placeholder="123 Main St" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-2">
            <FormField label="City" name="city" required placeholder="Charlotte" />
          </div>
          <FormField label="State" name="state" as="select">
            <option value="NC">NC</option>
            <option value="SC">SC</option>
          </FormField>
          <FormField label="Zip Code" name="zipCode" required placeholder="28202" />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-foreground">Organizer contact</legend>
        <FormField label="Organizer Name" name="contactName" required placeholder="Full name" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Email" name="contactEmail" type="email" required placeholder="you@example.com" />
          <FormField label="Phone" name="contactPhone" type="tel" required placeholder="(704) 555-1234" />
        </div>
      </fieldset>

      <div className="rounded-xl border border-dashed">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/50"
          onClick={() => setShowOptional((v) => !v)}
          aria-expanded={showOptional}
        >
          Optional details
          <span className="text-muted-foreground">{showOptional ? "Hide" : "Show"}</span>
        </button>
        {showOptional ? (
          <div className="space-y-6 border-t px-4 py-5">
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-foreground">Cuisine preferences (optional)</legend>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {cuisineOptions.map((cuisine) => (
                  <label
                    key={cuisine}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/50 cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    )}
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

            <FormField label="Budget / Payment Model" name="budgetRange" as="select">
              <option value="">Select budget range...</option>
              {budgetRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </FormField>

            <FormField
              label="Power Availability"
              name="powerAvailability"
              placeholder="e.g., 220V outlet available on site"
            />

            <FormField
              label="Parking / Setup Notes"
              name="parkingNotes"
              as="textarea"
              rows={3}
              placeholder="Loading zone, setup window, access restrictions, etc."
            />

            <FormField
              label="Additional Details"
              name="additionalNotes"
              as="textarea"
              rows={4}
              placeholder="Anything else trucks should know about your event."
            />
          </div>
        ) : null}
      </div>

      <div className="pt-4 border-t">
        <p className="mb-3 text-xs text-muted-foreground max-w-2xl">
          FoodTruckCLT connects organizers and independent vendors. Agreements and payments are handled directly
          between you and each truck.
        </p>
        <SubmitButton className="w-full sm:w-auto" isPending={isPending}>
          {isPending ? "Submitting..." : "Submit Event Request"}
        </SubmitButton>
      </div>
    </form>
  )
}
