export const BOOKING_REQUEST_TYPE = {
  SPECIFIC_VENDOR: "specific_vendor",
  CUISINE_MATCH: "cuisine_match",
  OPEN_REQUEST: "open_request",
} as const

export type BookingRequestTypeValue = (typeof BOOKING_REQUEST_TYPE)[keyof typeof BOOKING_REQUEST_TYPE]

export const VENDOR_TYPE_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "truck", label: "Truck" },
  { value: "cart", label: "Cart" },
  { value: "tent", label: "Tent" },
] as const
