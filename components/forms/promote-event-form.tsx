"use client"

import { useActionState } from "react"
import { submitEventPromotion, type EventPromotionResult } from "@/app/promote-event/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
const initial: EventPromotionResult | null = null

export function PromoteEventForm() {
  const [state, formAction, pending] = useActionState(submitEventPromotion, initial)

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="eventName">Event name</Label>
        <Input id="eventName" name="eventName" required autoComplete="off" placeholder="e.g. Southend Food Truck Friday" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="eventDate">Event date</Label>
        <Input id="eventDate" name="eventDate" type="date" required className="max-w-xs" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start time</Label>
          <Input id="startTime" name="startTime" type="time" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">End time</Label>
          <Input id="endTime" name="endTime" type="time" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="venueName">Venue / location name</Label>
        <Input id="venueName" name="venueName" autoComplete="organization" placeholder="e.g. Unknown Brewing Co. parking lot" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="streetAddress">Street address</Label>
        <Input id="streetAddress" name="streetAddress" autoComplete="street-address" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Event description</Label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          placeholder="What should people know? Trucks, live music, parking, rain date, etc."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="participatingTrucks">Participating food trucks (optional)</Label>
        <Textarea
          id="participatingTrucks"
          name="participatingTrucks"
          rows={2}
          placeholder="List trucks if you already know who’s coming, or type “TBA”"
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-foreground">Public or private event</legend>
        <div className="flex flex-col gap-2">
          <label className="flex items-start gap-2 text-sm font-normal leading-snug">
            <input type="radio" name="isPublic" value="true" defaultChecked className="mt-1" />
            <span>Public — anyone can attend or buy tickets</span>
          </label>
          <label className="flex items-start gap-2 text-sm font-normal leading-snug">
            <input type="radio" name="isPublic" value="false" className="mt-1" />
            <span>Private / invite-only</span>
          </label>
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="eventUrl">Event website or ticket link (optional)</Label>
        <Input
          id="eventUrl"
          name="eventUrl"
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder="https://"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="graphicUrl">Event graphic / flyer URL</Label>
        <Input id="graphicUrl" name="graphicUrl" type="url" inputMode="url" placeholder="https://" />
        <p className="text-xs text-muted-foreground">
          Paste a link to your event flyer, graphic, Facebook event image, Canva design, Instagram post, or
          promotional image.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="organizerName">Organizer name</Label>
        <Input id="organizerName" name="organizerName" required autoComplete="name" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="organizerEmail">Organizer email</Label>
        <Input id="organizerEmail" name="organizerEmail" type="email" required autoComplete="email" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="organizerPhone">Organizer phone (optional)</Label>
        <Input id="organizerPhone" name="organizerPhone" type="tel" autoComplete="tel" />
      </div>

      {state && !state.success && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
        {pending ? "Submitting…" : "Submit for review"}
      </Button>
    </form>
  )
}
