"use client"

import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { getEventDisplayImage } from "@/lib/events/event-display-image"

/** Match lib/storage/event-images (avoid importing that module client-side — it pulls in node:crypto). */
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

type Props = {
  adminKey: string
  eventId: string
  slug: string | null
  imageUrl: string | null
  featuredImageUrl: string | null
  uploadsEnabled?: boolean
}

function clientFileError(f: File): string | null {
  if (f.size === 0) return "Choose an image file."
  if (!ALLOWED_TYPES.has(f.type)) {
    return "Use JPG, PNG, or WebP (max 5 MB)."
  }
  if (f.size > MAX_BYTES) return "Image must be 5 MB or smaller."
  return null
}

export function AdminEventImageReplace({
  adminKey,
  eventId,
  slug,
  imageUrl,
  featuredImageUrl,
  uploadsEnabled = true,
}: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [uploadedPair, setUploadedPair] = useState<{ image: string; featured: string } | null>(null)

  const effectiveImage = uploadedPair?.image ?? imageUrl?.trim() ?? null
  const effectiveFeatured = uploadedPair?.featured ?? featuredImageUrl?.trim() ?? null
  const previewSrc = getEventDisplayImage(eventId, slug, {
    imageUrl: effectiveImage,
    featuredImageUrl: effectiveFeatured,
  })
  const hasCustom = Boolean(effectiveImage) || Boolean(effectiveFeatured)

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-start">
      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewSrc} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          tabIndex={-1}
          disabled={busy || !uploadsEnabled}
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ""
            if (!f) return
            const err = clientFileError(f)
            if (err) {
              setMessage(err)
              return
            }
            setMessage(null)
            setBusy(true)
            try {
              const fd = new FormData()
              fd.append("adminKey", adminKey)
              fd.append("eventId", eventId)
              fd.append("file", f)
              const res = await fetch("/api/upload-event-image", { method: "POST", body: fd })
              let data: { success?: boolean; publicUrl?: string; error?: string }
              try {
                data = await res.json()
              } catch {
                setMessage(`Invalid response (HTTP ${res.status})`)
                return
              }
              if (res.ok && data.success && typeof data.publicUrl === "string") {
                const u = data.publicUrl
                setUploadedPair({ image: u, featured: u })
                setMessage(null)
                router.refresh()
                return
              }
              setMessage(
                typeof data.error === "string" && data.error.trim() ? data.error : `HTTP ${res.status}`,
              )
            } finally {
              setBusy(false)
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy || !uploadsEnabled}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Uploading…" : hasCustom ? "Replace image" : "Add image"}
        </Button>
        {!uploadsEnabled ? (
          <p className="text-xs text-amber-800 dark:text-amber-200/90">
            Set <code className="text-[10px]">SUPABASE_SERVICE_ROLE_KEY</code> to enable uploads.
          </p>
        ) : null}
        {!hasCustom ? (
          <p className="text-xs text-muted-foreground">No event image — cards use a stock placeholder.</p>
        ) : null}
        {message ? <p className="text-xs text-destructive">{message}</p> : null}
      </div>
    </div>
  )
}
