"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import {
  getEventDisplayImage,
  getEventFallbackImage,
  type EventImageFields,
} from "@/lib/events/event-display-image"

type Props = {
  alt: string
  className?: string
  sizes?: string
  eventId: string
  slug?: string | null
} & EventImageFields

export function EventListingImage({
  alt,
  className,
  sizes,
  eventId,
  slug,
  imageUrl,
  featuredImageUrl,
}: Props) {
  const seed = `${eventId}:${slug ?? ""}`
  const preferred = getEventDisplayImage(eventId, slug, { imageUrl, featuredImageUrl })
  const deterministicFallback = getEventFallbackImage(seed)
  const [src, setSrc] = useState(preferred)

  useEffect(() => {
    setSrc(preferred)
  }, [preferred])

  const onError = useCallback(() => {
    setSrc((current) => (current === deterministicFallback ? current : deterministicFallback))
  }, [deterministicFallback])

  return (
    <Image src={src} alt={alt} fill className={className} sizes={sizes} onError={onError} />
  )
}
