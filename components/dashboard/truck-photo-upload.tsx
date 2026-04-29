"use client"

import { useActionState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { uploadVendorTruckPhoto } from "@/lib/supabase/storage"

type Props = {
  truckId: string
  initialPhotoUrl: string | null
}

export function TruckPhotoUpload({ truckId, initialPhotoUrl }: Props) {
  const initialState = { status: "idle" as const }
  const [state, formAction, isPending] = useActionState(uploadVendorTruckPhoto, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const previewUrl =
    state.status === "success" ? state.publicUrl : initialPhotoUrl?.trim() || null

  useEffect(() => {
    if (state.status === "success" || state.status === "error") {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }, [state])

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="truck-photo-file">Truck photo</Label>
        <form ref={formRef} action={formAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="truckId" value={truckId} />
          <input
            ref={fileInputRef}
            id="truck-photo-file"
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            disabled={isPending}
            aria-hidden
            tabIndex={-1}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f && formRef.current) formRef.current.requestSubmit()
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            className="relative"
            onClick={() => fileInputRef.current?.click()}
          >
            {isPending ? "Uploading…" : "Choose image"}
          </Button>
          <span className="text-xs text-muted-foreground">
            JPG, PNG, WebP, or GIF · max 5 MB
          </span>
        </form>
      </div>

      {state.status === "error" ? (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}

      {previewUrl ? (
        <div className="relative mt-2 max-h-64 max-w-md overflow-hidden rounded-lg border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Your truck photo preview"
            className="max-h-64 w-full object-cover"
          />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No photo yet — upload one for your listing.</p>
      )}
    </div>
  )
}
