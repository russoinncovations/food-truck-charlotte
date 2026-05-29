"use client"

import { AdminTruckPhotoReplace } from "@/components/admin/admin-truck-photo-replace"
import { TruckGalleryManager, type GalleryPhotoRow } from "@/components/trucks/truck-gallery-manager"

type Props = {
  adminKey: string
  truckId: string
  photoUrl: string | null
  heroPhotoUrl: string | null
  galleryPhotos: GalleryPhotoRow[]
  uploadsEnabled?: boolean
}

export function AdminTruckPhotosPanel({
  adminKey,
  truckId,
  photoUrl,
  heroPhotoUrl,
  galleryPhotos,
  uploadsEnabled = true,
}: Props) {
  return (
    <div className="space-y-5 min-w-[280px]">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Listing photo</p>
        <AdminTruckPhotoReplace
          adminKey={adminKey}
          truckId={truckId}
          photoTarget="listing"
          initialPhotoUrl={photoUrl}
          uploadsEnabled={uploadsEnabled}
        />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Hero photo</p>
        <AdminTruckPhotoReplace
          adminKey={adminKey}
          truckId={truckId}
          photoTarget="hero"
          initialPhotoUrl={heroPhotoUrl}
          uploadsEnabled={uploadsEnabled}
        />
      </div>
      <TruckGalleryManager
        truckId={truckId}
        initialPhotos={galleryPhotos}
        adminKey={adminKey}
        uploadsEnabled={uploadsEnabled}
      />
    </div>
  )
}
