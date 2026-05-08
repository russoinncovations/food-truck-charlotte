"use client"

import { useId, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { EVENT_IMAGE_MAX_BYTES, EVENT_IMAGE_ALLOWED_TYPES } from "@/lib/storage/event-images"

const ACCEPT = "image/jpeg,image/png,image/webp"

type EventImageFieldProps = {
  /** Name for the hidden input submitted with the form (public URL or empty). */
  hiddenFieldName: string
  /** When set, upload is authorized as admin quick-add. */
  adminKey?: string
  /** When set, upload is authorized for this truck (logged-in vendor). */
  truckId?: string
  onBusyChange?: (busy: boolean) => void
}

function validateClientFile(f: File): string | null {
  if (!EVENT_IMAGE_ALLOWED_TYPES.has(f.type)) {
    return "Please use a JPG, PNG, or WebP image (max 5 MB)."
  }
  if (f.size > EVENT_IMAGE_MAX_BYTES) {
    return "Image must be 5 MB or smaller."
  }
  if (f.size === 0) return "Choose an image file."
  return null
}

export function EventImageField({
  hiddenFieldName,
  adminKey,
  truckId,
  onBusyChange,
}: EventImageFieldProps) {
  const reactId = useId()
  const inputId = `event-image-file-${reactId.replace(/\W/g, "")}`
  const [publicUrl, setPublicUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    setError(null)
    setPublicUrl("")
    if (!f) {
      return
    }
    const err = validateClientFile(f)
    if (err) {
      setError(err)
      e.target.value = ""
      return
    }

    setUploading(true)
    onBusyChange?.(true)
    const fd = new FormData()
    fd.append("file", f)
    if (adminKey) fd.append("adminKey", adminKey)
    if (truckId) fd.append("truckId", truckId)

    try {
      const res = await fetch("/api/upload-event-image", { method: "POST", body: fd })
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean
        publicUrl?: string
        error?: string
      }
      if (!res.ok || !data.success || !data.publicUrl) {
        setError(typeof data.error === "string" ? data.error : "Upload failed. Try again.")
        e.target.value = ""
        return
      }
      setPublicUrl(data.publicUrl)
    } catch {
      setError("Upload failed. Check your connection and try again.")
      e.target.value = ""
    } finally {
      setUploading(false)
      onBusyChange?.(false)
    }
  }

  function clearImage() {
    setPublicUrl("")
    setError(null)
    const el = typeof document !== "undefined" ? document.getElementById(inputId) : null
    if (el instanceof HTMLInputElement) el.value = ""
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={hiddenFieldName} value={publicUrl} readOnly />
      <Label htmlFor={inputId}>Event Image</Label>
      <Input
        id={inputId}
        type="file"
        accept={ACCEPT}
        onChange={onFileChange}
        disabled={uploading}
        className="cursor-pointer file:cursor-pointer"
      />
      <p className="text-xs text-muted-foreground">
        Upload a flyer, event graphic, or food truck photo. JPG, PNG, or WebP preferred.
      </p>
      {uploading ? (
        <p className="text-sm text-muted-foreground">Uploading image…</p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {publicUrl && !uploading ? (
        <p className="text-xs text-muted-foreground">
          Image ready to submit.{" "}
          <button
            type="button"
            onClick={clearImage}
            className="text-foreground underline underline-offset-2 hover:text-primary"
          >
            Remove
          </button>
        </p>
      ) : null}
    </div>
  )
}
