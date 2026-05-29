"use client"

import { TruckPhotoUploadField } from "@/components/trucks/truck-photo-upload-field"
import type { TruckPhotoTarget } from "@/lib/trucks/truck-photo-upload-shared"

type Props = {
  adminKey: string
  truckId: string
  photoTarget?: TruckPhotoTarget
  initialPhotoUrl: string | null
  /** False when `SUPABASE_SERVICE_ROLE_KEY` is not configured. */
  uploadsEnabled?: boolean
}

export function AdminTruckPhotoReplace({
  adminKey,
  truckId,
  photoTarget = "listing",
  initialPhotoUrl,
  uploadsEnabled = true,
}: Props) {
  return (
    <TruckPhotoUploadField
      truckId={truckId}
      photoTarget={photoTarget}
      initialPhotoUrl={initialPhotoUrl}
      adminKey={adminKey}
      uploadsEnabled={uploadsEnabled}
      compact
    />
  )
}
