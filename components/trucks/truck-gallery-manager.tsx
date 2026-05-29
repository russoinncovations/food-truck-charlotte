"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { TruckPhotoUploadField } from "@/components/trucks/truck-photo-upload-field"

export type GalleryPhotoRow = {
  id: string
  photo_url: string
  alt_text: string | null
}

type Props = {
  truckId: string
  initialPhotos: GalleryPhotoRow[]
  adminKey?: string
  uploadsEnabled?: boolean
}

export function TruckGalleryManager({
  truckId,
  initialPhotos,
  adminKey,
  uploadsEnabled = true,
}: Props) {
  const router = useRouter()
  const [photos, setPhotos] = useState(initialPhotos)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    setPhotos(initialPhotos)
  }, [initialPhotos])

  async function deletePhoto(photoId: string) {
    setDeleteError(null)
    setDeletingId(photoId)
    try {
      const fd = new FormData()
      fd.append("action", "delete")
      fd.append("truckId", truckId)
      fd.append("photoId", photoId)
      if (adminKey) fd.append("adminKey", adminKey)

      const res = await fetch("/api/upload-truck-photo", {
        method: "POST",
        body: fd,
        credentials: adminKey ? "same-origin" : "include",
      })

      const data = (await res.json()) as { success?: boolean; error?: string }
      if (!res.ok || !data.success) {
        setDeleteError(data.error ?? "Could not remove photo.")
        return
      }

      setPhotos((prev) => prev.filter((p) => p.id !== photoId))
      router.refresh()
    } catch {
      setDeleteError("Could not remove photo.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Photo gallery</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Optional extra photos for your public truck profile. Upload images — no URLs needed.
        </p>
      </div>

      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <li key={photo.id} className="relative group rounded-lg border overflow-hidden bg-muted aspect-[4/3]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.photo_url} alt={photo.alt_text ?? "Gallery photo"} className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs w-full"
                  disabled={!uploadsEnabled || deletingId === photo.id}
                  onClick={() => deletePhoto(photo.id)}
                >
                  {deletingId === photo.id ? "Removing…" : "Remove"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center">
          No gallery photos yet.
        </p>
      )}

      <TruckPhotoUploadField
        truckId={truckId}
        photoTarget="gallery"
        initialPhotoUrl={null}
        adminKey={adminKey}
        uploadsEnabled={uploadsEnabled}
        compact
        onUploaded={() => router.refresh()}
      />

      {deleteError ? <p className="text-xs text-destructive">{deleteError}</p> : null}
    </div>
  )
}
