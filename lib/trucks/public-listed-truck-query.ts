/**
 * Trucks safe to show on anonymous public surfaces (detail URL, directory, map pins, homepage previews).
 * Internal/demo rows stay usable via dashboard and booking flows without appearing here.
 */
export const PUBLIC_LISTED_TRUCK_EQ = {
  show_in_directory: true,
  is_active: true,
  status: "active",
} as const
