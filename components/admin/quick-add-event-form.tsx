"use client"

import { useActionState } from "react"
import Link from "next/link"
import { submitQuickAddEvent, type QuickAddEventResult } from "@/app/admin/events/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const initial: QuickAddEventResult | null = null

type Props = { adminKey: string }

export function QuickAddEventForm({ adminKey }: Props) {
  const [state, formAction, pending] = useActionState(submitQuickAddEvent, initial)
  const listHref = `/admin/events?key=${encodeURIComponent(adminKey)}`

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      <input type="hidden" name="adminKey" value={adminKey} />

      {state?.success ? (
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400" role="status">
          Event saved.{" "}
          <Link href={listHref} className="underline">
            Back to events admin
          </Link>
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="sourcePaste">Paste flyer text or Facebook caption</Label>
        <Textarea
          id="sourcePaste"
          name="sourcePaste"
          rows={4}
          placeholder="Optional — paste text here for your reference; stored with the event."
        />
        <p className="text-xs text-muted-foreground">
          Paste the text from a flyer, Facebook post, or event caption here to help fill the event details
          quickly.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Event name</Label>
        <Input id="title" name="title" required placeholder="Event title" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Event date</Label>
        <Input id="date" name="date" type="date" required className="max-w-xs" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="start_time">Start time</Label>
          <Input id="start_time" name="start_time" type="time" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_time">End time</Label>
          <Input id="end_time" name="end_time" type="time" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location_name">Venue / location name</Label>
        <Input id="location_name" name="location_name" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Street address</Label>
        <Input id="address" name="address" autoComplete="street-address" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Event description</Label>
        <Textarea id="description" name="description" rows={5} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="participating_trucks">Participating food trucks (optional)</Label>
        <Textarea id="participating_trucks" name="participating_trucks" rows={2} />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-foreground">Public or private event</legend>
        <div className="flex flex-col gap-2">
          <label className="flex items-start gap-2 text-sm font-normal leading-snug">
            <input type="radio" name="is_public" value="true" defaultChecked className="mt-1" />
            <span>Public</span>
          </label>
          <label className="flex items-start gap-2 text-sm font-normal leading-snug">
            <input type="radio" name="is_public" value="false" className="mt-1" />
            <span>Private / invite-only</span>
          </label>
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="event_website_url">Event website or ticket link (optional)</Label>
        <Input id="event_website_url" name="event_website_url" type="url" placeholder="https://" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="facebook_post_url">Facebook post URL (optional)</Label>
        <Input id="facebook_post_url" name="facebook_post_url" type="url" placeholder="https://" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="graphic_url">Event graphic / flyer URL</Label>
        <Input id="graphic_url" name="graphic_url" type="url" placeholder="https://" />
        <p className="text-xs text-muted-foreground">
          Paste a link to your event flyer, graphic, Facebook event image, Canva design, Instagram post, or
          promotional image.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="organizer_name">Organizer name (optional)</Label>
        <Input id="organizer_name" name="organizer_name" autoComplete="name" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="organizer_email">Organizer email (optional)</Label>
        <Input id="organizer_email" name="organizer_email" type="email" autoComplete="email" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="organizer_phone">Organizer phone (optional)</Label>
        <Input id="organizer_phone" name="organizer_phone" type="tel" autoComplete="tel" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="listing_status">Status</Label>
        <input type="hidden" name="listing_status" value="approved" id="listing-status-value" readOnly className="hidden" />
        <StatusSelect
          onChange={(v) => {
            const el = document.getElementById("listing-status-value") as HTMLInputElement | null
            if (el) el.value = v
          }}
        />
        <p className="text-xs text-muted-foreground">
          Default is <span className="text-foreground font-medium">approved</span> for admin-created events.
        </p>
      </div>

      {state && !state.success && "error" in state ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending || state?.success === true}>
          {pending ? "Saving…" : "Save event"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={listHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  )
}
