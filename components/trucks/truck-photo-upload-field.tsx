"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { getTruckDisplayImage } from "@/lib/trucks/truck-display-image"
import {
  TRUCK_PHOTO_ACCEPT,
  truckPhotoTargetLabel,
  validateTruckPhotoFile,
  type TruckPhotoTarget,
} from "@/lib/trucks/truck-photo-upload-shared"

type Props = {
  truckId: string
  photoTarget: TruckPhotoTarget
  initialPhotoUrl: string | null
  description?: string
  adminKey?: string
  uploadsEnabled?: boolean
  compact?: boolean
  onUploaded?: (publicUrl: string) => void
}

type PhotoState =
  | { status: "idle" }
  | { status: "success"; publicUrl: string }
  | { status: "error"; message: string }

export function TruckPhotoUploadField({
  truckId,
  photoTarget,
  initialPhotoUrl,
  description,
  adminKey,
  uploadsEnabled = true,
  compact = false,
  onUploaded,
}: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<PhotoState>({ status: "idle" })
  const [isPending, setIsPending] = useState(false)

  const previewUrl =
    state.status === "success" ? state.publicUrl : initialPhotoUrl?.trim() || null
  const previewSrc = previewUrl ? previewUrl : getTruckDisplayImage(truckId, null)

  useEffect(() => {
    if (state.status === "success" || state.status === "error") {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }, [state])

  const label = truckPhotoTargetLabel(photoTarget)
  const inputId = `truck-photo-${photoTarget}-${truckId}`

  async function handleFile(f: File) {
    const clientErr = validateTruckPhotoFile(f)
    if (clientErr) {
      setState({ status: "error", message: clientErr })
      return
    }

    setState({ status: "idle" })
    setIsPending(true)

    try {
      const fd = new FormData()
      fd.append("truckId", truckId)
      fd.append("file", f)
      fd.append("photoTarget", photoTarget)
      if (adminKey) fd.append("adminKey", adminKey)

      const res = await fetch("/api/upload-truck-photo", {
        method: "POST",
        body: fd,
        credentials: adminKey ? "same-origin" : "include",
      })

      let data: { success?: boolean; publicUrl?: string; error?: string; galleryPhotoId?: string }
      try {
        data = await res.json()
      } catch {
        setState({ status: "error", message: `Invalid response (HTTP ${res.status})` })
        return
      }

      if (res.ok && data.success === true && typeof data.publicUrl === "string") {
        setState({ status: "success", publicUrl: data.publicUrl })
        onUploaded?.(data.publicUrl)
        router.refresh()
        return
      }

      const msg =
        typeof data.error === "string" && data.error.trim() ? data.error : `Upload failed (HTTP ${res.status})`
      setState({ status: "error", message: msg })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed."
      setState({ status: "error", message })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="space-y-2">
        <Label htmlFor={inputId}>{label}</Label>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept={TRUCK_PHOTO_ACCEPT}
            className="sr-only"
            disabled={isPending || !uploadsEnabled}
            aria-hidden
            tabIndex={-1}
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              await handleFile(f)
            }}
          />
          <Button
            type="button"
            variant="outline"
            size={compact ? "sm" : "default"}
            disabled={isPending || !uploadsEnabled}
            onClick={() => fileInputRef.current?.click()}
          >
            {isPending ? "Uploading…" : previewUrl ? "Replace image" : "Upload image"}
          </Button>
          <span className="text-xs text-muted-foreground">JPG, PNG, or WebP · max 5 MB</span>
        </div>
      </div>

      {!uploadsEnabled ? (
        <p className="text-xs text-amber-800 dark:text-amber-200/90">
          Photo uploads are temporarily unavailable.
        </p>
      ) : null}

      {state.status === "error" ? (
        <p className="text-xs text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
          {state.message} Your previous photo is unchanged.
        </p>
      ) : null}

      {photoTarget !== "gallery" ? (
        <div
          className={`relative overflow-hidden rounded-lg border border-border bg-muted ${
            compact ? "h-16 w-24" : "max-h-64 max-w-md"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl ?? previewSrc}
            alt={`${label} preview`}
            className={compact ? "h-full w-full object-cover" : "max-h-64 w-full object-cover"}
          />
        </div>
      ) : null}

      {!previewUrl && photoTarget !== "gallery" ? (
        <p className="text-xs text-muted-foreground">No custom photo — a stock placeholder is used publicly.</p>
      ) : null}
    </div>
  )
}
