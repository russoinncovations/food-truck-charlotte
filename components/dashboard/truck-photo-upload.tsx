"use client"

import { TruckPhotoUploadField } from "@/components/trucks/truck-photo-upload-field"

type Props = {
  truckId: string
  initialPhotoUrl: string | null
}

/** @deprecated Prefer TruckPhotoUploadField with an explicit photoTarget. */
export function TruckPhotoUpload({ truckId, initialPhotoUrl }: Props) {
  return (
    <TruckPhotoUploadField
      truckId={truckId}
      photoTarget="listing"
      initialPhotoUrl={initialPhotoUrl}
      description="Main photo used in the directory and cards."
    />
  )
}
