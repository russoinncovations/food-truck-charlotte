"use client"

import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { getTruckDisplayImage } from "@/lib/trucks/truck-display-image"

type Props = {
  adminKey: string
  truckId: string
  initialPhotoUrl: string | null
  /** False when `SUPABASE_SERVICE_ROLE_KEY` is not configured. */
  uploadsEnabled?: boolean
}

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

function clientFileError(f: File): string | null {
  if (!ALLOWED.has(f.type)) {
    return "Use JPG, PNG, WebP, or GIF (max 5 MB)."
  }
  if (f.size > MAX_BYTES) return "Image must be 5 MB or smaller."
  if (f.size === 0) return "Choose an image file."
  return null
}

export function AdminTruckPhotoReplace({
  adminKey,
  truckId,
  initialPhotoUrl,
  uploadsEnabled = true,
}: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)

  const customUrl = uploadedUrl ?? initialPhotoUrl?.trim() ?? null
  const previewSrc = getTruckDisplayImage(truckId, customUrl)
  const usingPlaceholder = !customUrl

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
          accept="image/jpeg,image/png,image/webp,image/gif"
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
              fd.append("truckId", truckId)
              fd.append("file", f)
              const res = await fetch("/api/upload-truck-photo", { method: "POST", body: fd })
              let data: { success?: boolean; publicUrl?: string; error?: string }
              try {
                data = await res.json()
              } catch {
                setMessage(`Invalid response (HTTP ${res.status})`)
                return
              }
              if (res.ok && data.success && typeof data.publicUrl === "string") {
                setUploadedUrl(data.publicUrl)
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
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy || !uploadsEnabled}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "Uploading…" : initialPhotoUrl?.trim() ? "Replace photo" : "Add photo"}
          </Button>
        </div>
        {!uploadsEnabled ? (
          <p className="text-xs text-amber-800 dark:text-amber-200/90">
            Set <code className="text-[10px]">SUPABASE_SERVICE_ROLE_KEY</code> to enable uploads.
          </p>
        ) : null}
        {usingPlaceholder ? (
          <p className="text-xs text-muted-foreground">No custom photo — public listing uses a stock image.</p>
        ) : null}
        {message ? <p className="text-xs text-destructive">{message}</p> : null}
      </div>
    </div>
  )
}
