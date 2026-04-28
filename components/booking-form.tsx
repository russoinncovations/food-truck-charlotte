"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Calendar, 
  MapPin, 
  Utensils, 
  User, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Clock,
  Users,
  Building2,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  EVENT_TYPES, 
  BUDGET_RANGES, 
  CUISINE_OPTIONS, 
  DIETARY_OPTIONS,
  HOW_HEARD_OPTIONS,
  type BookingFormData,
  type EventType,
  type BudgetRange,
} from "@/lib/booking-types"
import { BOOKING_REQUEST_TYPE, VENDOR_TYPE_OPTIONS } from "@/lib/booking/booking-request-constants"
import { submitBookingRequest } from "@/app/book-trucks/actions"

const STEPS = [
  { id: 1, title: "Event Details", icon: Calendar },
  { id: 2, title: "Location", icon: MapPin },
  { id: 3, title: "Food & budget", icon: Utensils },
  { id: 4, title: "Contact Info", icon: User },
]

const initialFormData: BookingFormData = {
  request_type: "open_request",
  truck_id: null,
  vendor_type: "",
  event_type: "private",
  event_date: "",
  event_start_time: "",
  event_end_time: "",
  expected_guests: 50,
  venue_name: "",
  venue_address: "",
  venue_city: "Charlotte",
  venue_state: "NC",
  venue_zip: "",
  cuisine_preferences: [],
  specific_trucks: [],
  dietary_requirements: [],
  budget_range: "flexible",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  organization_name: "",
  additional_notes: "",
  how_heard_about_us: "",
}

const BOOKING_PATH_OPTIONS: {
  value: BookingFormData["request_type"]
  title: string
  hint: string
}[] = [
  {
    value: BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR,
    title: "A specific food truck/vendor",
    hint: "Pick from our directory; they receive your request directly.",
  },
  {
    value: BOOKING_REQUEST_TYPE.CUISINE_MATCH,
    title: "A vendor by cuisine/category",
    hint: "We’ll use your cuisine choices to help with matching.",
  },
  {
    value: BOOKING_REQUEST_TYPE.OPEN_REQUEST,
    title: "Any available food truck/cart/tent",
    hint: "Open request — our team follows up with you.",
  },
]

export function BookingForm({ directoryTrucks }: { directoryTrucks: { id: string; name: string }[] }) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<BookingFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateFormData = <K extends keyof BookingFormData>(
    field: K,
    value: BookingFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const toggleArrayField = (
    field: "cuisine_preferences" | "specific_trucks" | "dietary_requirements",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }))
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.event_date) newErrors.event_date = "Event date is required"
      if (!formData.expected_guests || formData.expected_guests < 1) {
        newErrors.expected_guests = "Number of guests is required"
      }
      if (formData.request_type === BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR && !formData.truck_id) {
        newErrors.truck_id = "Select which truck or vendor you want at the top of the form"
      }
    }

    if (step === 2) {
      if (!formData.venue_address) newErrors.venue_address = "Address is required"
    }

    if (step === 3) {
      if (formData.request_type === BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR && !formData.truck_id) {
        newErrors.truck_id = "Select a food truck"
      }
      if (
        formData.request_type === BOOKING_REQUEST_TYPE.CUISINE_MATCH &&
        formData.cuisine_preferences.length === 0
      ) {
        newErrors.cuisine_preferences = "Choose at least one cuisine"
      }
    }

    if (step === 4) {
      if (!formData.contact_name) newErrors.contact_name = "Name is required"
      if (!formData.contact_email) {
        newErrors.contact_email = "Email is required"
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
        newErrors.contact_email = "Please enter a valid email"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4))
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      setCurrentStep(3)
      return
    }
    if (!validateStep(4)) return

    setIsSubmitting(true)
    try {
      const result = await submitBookingRequest(formData)
      
      if (result.success) {
        router.push(`/book-trucks/success?id=${result.bookingId}`)
      } else {
        setErrors({ submit: result.error || "Failed to submit booking" })
      }
    } catch {
      setErrors({ submit: "Something went wrong. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Always visible: what are you looking for? */}
      <Card className="border-2 border-primary/20 bg-muted/40 shadow-sm overflow-hidden">
        <CardContent className="p-5 md:p-6 space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-foreground tracking-tight">What are you looking for?</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Choose one before you continue — you can move through the steps below anytime.
            </p>
          </div>
          <div className="grid gap-3" role="group" aria-label="Booking request type">
            {BOOKING_PATH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    request_type: opt.value,
                    truck_id: opt.value === BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR ? prev.truck_id : null,
                  }))
                }
                className={cn(
                  "text-left rounded-lg border-2 p-4 transition-colors",
                  formData.request_type === opt.value
                    ? "border-primary bg-background shadow-sm"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <span className="font-semibold text-foreground block">{opt.title}</span>
                <span className="text-sm text-muted-foreground mt-1 block">{opt.hint}</span>
              </button>
            ))}
          </div>

          {formData.request_type === BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR && (
            <div className="space-y-2 pt-2 border-t border-border/80">
              <Label className="text-sm font-semibold">
                Which truck/vendor do you want? <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.truck_id ?? undefined}
                onValueChange={(v) => updateFormData("truck_id", v || null)}
              >
                <SelectTrigger className={cn("h-11 bg-background", errors.truck_id && "border-destructive")}>
                  <SelectValue placeholder="Select a truck or vendor…" />
                </SelectTrigger>
                <SelectContent>
                  {directoryTrucks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.truck_id && <p className="text-xs text-destructive">{errors.truck_id}</p>}
              {directoryTrucks.length === 0 && (
                <p className="text-sm text-destructive">No trucks in the directory right now.</p>
              )}
            </div>
          )}

          {(formData.request_type === BOOKING_REQUEST_TYPE.CUISINE_MATCH ||
            formData.request_type === BOOKING_REQUEST_TYPE.OPEN_REQUEST) && (
            <div className="space-y-2 pt-2 border-t border-border/80">
              <Label className="text-sm font-semibold">Vendor format</Label>
              <p className="text-xs text-muted-foreground">
                {formData.request_type === BOOKING_REQUEST_TYPE.CUISINE_MATCH
                  ? "Truck, cart, tent, or any available format."
                  : "Optional — narrow down the type of vendor if you’d like."}
              </p>
              <Select
                value={formData.vendor_type === "" ? "none" : formData.vendor_type}
                onValueChange={(v) => updateFormData("vendor_type", v === "none" ? "" : v)}
              >
                <SelectTrigger className="h-11 bg-background">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Any</SelectItem>
                  {VENDOR_TYPE_OPTIONS.filter((o) => o.value !== "any").map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-8">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                    currentStep > step.id
                      ? "bg-primary border-primary text-primary-foreground"
                      : currentStep === step.id
                      ? "border-primary text-primary bg-primary/10"
                      : "border-muted text-muted-foreground"
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium hidden sm:block",
                    currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-12 sm:w-24 h-0.5 mx-2",
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 sm:p-8">
          {/* Step 1: Event Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-1">
                  Tell us about your event
                </h2>
                <p className="text-sm text-muted-foreground">
                  Help us understand what you&apos;re planning so we can match you with the right trucks.
                </p>
              </div>

              {/* Event Type */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">What type of event is this?</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {EVENT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => updateFormData("event_type", type.value)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all",
                        formData.event_type === type.value
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <span className="block text-sm font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event_date" className="text-sm font-medium">
                    Event Date *
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="event_date"
                      type="date"
                      value={formData.event_date}
                      onChange={(e) => updateFormData("event_date", e.target.value)}
                      className={cn("pl-10", errors.event_date && "border-destructive")}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  {errors.event_date && (
                    <p className="text-xs text-destructive">{errors.event_date}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_start_time" className="text-sm font-medium">
                    Start Time
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="event_start_time"
                      type="time"
                      value={formData.event_start_time}
                      onChange={(e) => updateFormData("event_start_time", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_end_time" className="text-sm font-medium">
                    End Time
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="event_end_time"
                      type="time"
                      value={formData.event_end_time}
                      onChange={(e) => updateFormData("event_end_time", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Guest Count */}
              <div className="space-y-2">
                <Label htmlFor="expected_guests" className="text-sm font-medium">
                  Expected Number of Guests *
                </Label>
                <div className="relative max-w-xs">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="expected_guests"
                    type="number"
                    min={1}
                    value={formData.expected_guests}
                    onChange={(e) => updateFormData("expected_guests", parseInt(e.target.value) || 0)}
                    className={cn("pl-10", errors.expected_guests && "border-destructive")}
                    placeholder="50"
                  />
                </div>
                {errors.expected_guests && (
                  <p className="text-xs text-destructive">{errors.expected_guests}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  This helps trucks prepare the right amount of food.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-1">
                  Where is the event?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Provide the event location so trucks can assess access and parking.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue_name" className="text-sm font-medium">
                  Venue Name (optional)
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="venue_name"
                    value={formData.venue_name}
                    onChange={(e) => updateFormData("venue_name", e.target.value)}
                    className="pl-10"
                    placeholder="e.g., Olde Mecklenburg Brewery"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue_address" className="text-sm font-medium">
                  Street Address *
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="venue_address"
                    value={formData.venue_address}
                    onChange={(e) => updateFormData("venue_address", e.target.value)}
                    className={cn("pl-10", errors.venue_address && "border-destructive")}
                    placeholder="123 Main Street"
                  />
                </div>
                {errors.venue_address && (
                  <p className="text-xs text-destructive">{errors.venue_address}</p>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="venue_city" className="text-sm font-medium">
                    City
                  </Label>
                  <Input
                    id="venue_city"
                    value={formData.venue_city}
                    onChange={(e) => updateFormData("venue_city", e.target.value)}
                    placeholder="Charlotte"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venue_state" className="text-sm font-medium">
                    State
                  </Label>
                  <Input
                    id="venue_state"
                    value={formData.venue_state}
                    onChange={(e) => updateFormData("venue_state", e.target.value)}
                    placeholder="NC"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venue_zip" className="text-sm font-medium">
                    ZIP Code
                  </Label>
                  <Input
                    id="venue_zip"
                    value={formData.venue_zip}
                    onChange={(e) => updateFormData("venue_zip", e.target.value)}
                    placeholder="28202"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Tip:</strong> Food trucks typically need a flat, 
                  paved surface with access to the street. Let us know in the notes if you have any 
                  special access considerations.
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-1">
                  Food preferences &amp; budget
                </h2>
                <p className="text-sm text-muted-foreground">
                  You already chose how we should route your request at the top. Add details here.
                </p>
              </div>

              {formData.request_type !== BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    {formData.request_type === BOOKING_REQUEST_TYPE.CUISINE_MATCH
                      ? "Cuisines / categories *"
                      : "Cuisines (optional)"}
                  </Label>
                  {formData.request_type === BOOKING_REQUEST_TYPE.CUISINE_MATCH ? (
                    <p className="text-xs text-muted-foreground">Select at least one for a cuisine-based request.</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Optional — helps us understand what you like.
                    </p>
                  )}
                  {errors.cuisine_preferences && (
                    <p className="text-xs text-destructive">{errors.cuisine_preferences}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {CUISINE_OPTIONS.map((cuisine) => (
                      <button
                        key={cuisine}
                        type="button"
                        onClick={() => toggleArrayField("cuisine_preferences", cuisine)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm border transition-all",
                          formData.cuisine_preferences.includes(cuisine)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {cuisine}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dietary Requirements */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Dietary Requirements</Label>
                <div className="space-y-2">
                  {DIETARY_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <Checkbox
                        checked={formData.dietary_requirements.includes(option)}
                        onCheckedChange={() => toggleArrayField("dietary_requirements", option)}
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Budget Range</Label>
                <Select
                  value={formData.budget_range}
                  onValueChange={(value) => updateFormData("budget_range", value as BudgetRange)}
                >
                  <SelectTrigger className="max-w-xs">
                    <SelectValue placeholder="Select your budget" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGET_RANGES.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Most trucks have minimums of $500-1,500 depending on the event duration.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Contact Info */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-1">
                  Your contact information
                </h2>
                <p className="text-sm text-muted-foreground">
                  We&apos;ll use this to send you truck options and coordinate your booking.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_name" className="text-sm font-medium">
                    Your Name *
                  </Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => updateFormData("contact_name", e.target.value)}
                    className={cn(errors.contact_name && "border-destructive")}
                    placeholder="John Smith"
                  />
                  {errors.contact_name && (
                    <p className="text-xs text-destructive">{errors.contact_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organization_name" className="text-sm font-medium">
                    Organization (optional)
                  </Label>
                  <Input
                    id="organization_name"
                    value={formData.organization_name}
                    onChange={(e) => updateFormData("organization_name", e.target.value)}
                    placeholder="Company or group name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_email" className="text-sm font-medium">
                    Email *
                  </Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => updateFormData("contact_email", e.target.value)}
                    className={cn(errors.contact_email && "border-destructive")}
                    placeholder="john@example.com"
                  />
                  {errors.contact_email && (
                    <p className="text-xs text-destructive">{errors.contact_email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone" className="text-sm font-medium">
                    Phone (optional)
                  </Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => updateFormData("contact_phone", e.target.value)}
                    placeholder="(704) 555-0123"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional_notes" className="text-sm font-medium">
                  Additional Notes (optional)
                </Label>
                <Textarea
                  id="additional_notes"
                  value={formData.additional_notes}
                  onChange={(e) => updateFormData("additional_notes", e.target.value)}
                  placeholder="Any other details about your event, special requests, or questions..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="how_heard" className="text-sm font-medium">
                  How did you hear about us?
                </Label>
                <Select
                  value={formData.how_heard_about_us}
                  onValueChange={(value) => updateFormData("how_heard_about_us", value)}
                >
                  <SelectTrigger className="max-w-xs">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOW_HEARD_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {errors.submit && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm">
                  {errors.submit}
                </div>
              )}

              {/* Summary */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h3 className="font-medium text-foreground">Booking Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground">Looking for: </span>
                    <span className="text-foreground font-medium">
                      {BOOKING_PATH_OPTIONS.find((o) => o.value === formData.request_type)?.title}
                    </span>
                    {formData.request_type === BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR && formData.truck_id ? (
                      <span className="text-foreground block text-xs mt-1">
                        Vendor:{" "}
                        {directoryTrucks.find((t) => t.id === formData.truck_id)?.name ?? "—"}
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Event: </span>
                    <span className="text-foreground">
                      {EVENT_TYPES.find((t) => t.value === formData.event_type)?.label}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date: </span>
                    <span className="text-foreground">
                      {formData.event_date
                        ? new Date(formData.event_date + "T00:00:00").toLocaleDateString()
                        : "Not set"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Guests: </span>
                    <span className="text-foreground">{formData.expected_guests}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location: </span>
                    <span className="text-foreground">{formData.venue_city}, {formData.venue_state}</span>
                  </div>
                </div>
                {formData.cuisine_preferences.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {formData.cuisine_preferences.map((cuisine) => (
                      <Badge key={cuisine} variant="secondary" className="text-xs">
                        {cuisine}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className={cn(currentStep === 1 && "invisible")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {currentStep < 4 ? (
              <Button type="button" onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Request
                    <Check className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
