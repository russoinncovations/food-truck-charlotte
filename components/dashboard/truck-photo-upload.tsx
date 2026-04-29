"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

type Props = {
  truckId: string
  initialPhotoUrl: string | null
}

type PhotoState =
  | { status: "idle" }
  | { status: "success"; publicUrl: string }
  | { status: "error"; message: string }

function serializeClientError(err: unknown): string {
  if (err instanceof Error) {
    return `${err.name}: ${err.message}${err.stack ? `\n${err.stack}` : ""}`
  }
  try {
    return JSON.stringify(err, null, 2)
  } catch {
    return String(err)
  }
}

export function TruckPhotoUpload({ truckId, initialPhotoUrl }: Props) {
  const [state, setState] = useState<PhotoState>({ status: "idle" })
  const [isPending, setIsPending] = useState(false)
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
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            id="truck-photo-file"
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            disabled={isPending}
            aria-hidden
            tabIndex={-1}
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return

              const fd = new FormData()
              fd.append("truckId", truckId)
              fd.append("file", f)

              console.log("[TruckPhotoUpload] starting upload", {
                truckId,
                fileName: f.name,
                size: f.size,
                type: f.type,
              })

              setIsPending(true)

              try {
                const res = await fetch("/api/upload-truck-photo", {
                  method: "POST",
                  body: fd,
                  credentials: "include",
                })

                let data: { success?: boolean; publicUrl?: string; error?: string }
                try {
                  data = await res.json()
                } catch {
                  const message = `Invalid response (HTTP ${res.status})`
                  console.error("[TruckPhotoUpload] failed to parse JSON:", message)
                  setState({ status: "error", message })
                  return
                }

                console.log("[TruckPhotoUpload] API response:", data)
                console.log("[TruckPhotoUpload] API JSON:", JSON.stringify(data, null, 2))

                if (res.ok && data.success === true && typeof data.publicUrl === "string") {
                  setState({ status: "success", publicUrl: data.publicUrl })
                  return
                }

                const msg =
                  typeof data.error === "string" && data.error.trim()
                    ? data.error
                    : `HTTP ${res.status}`
                console.error("[TruckPhotoUpload] API returned error:", msg)
                setState({ status: "error", message: msg })
              } catch (err) {
                console.error("[TruckPhotoUpload] fetch exception:", err)
                const message = serializeClientError(err)
                console.error("[TruckPhotoUpload] serialized caught error:", message)
                setState({ status: "error", message })
              } finally {
                setIsPending(false)
              }
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
        </div>
      </div>

      {state.status === "error" ? (
        <pre
          className="whitespace-pre-wrap break-words rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
          role="alert"
        >
          {state.message}
        </pre>
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
