import { createClient } from "@/lib/supabase/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { easternDateStringToday, publicUpcomingEventsOrFilter } from "@/lib/events/public-events"
import { isOpportunityActiveAndActionable, type OpportunityBookingTiming } from "@/lib/booking/opportunity-active"

export type AdminActivityItem = {
  id: string
  kind: "booking" | "vendor_application" | "truck" | "event" | "opportunity"
  label: string
  title: string
  at: string
  status: string | null
  href: string
}

export type AdminCommandCenterData = {
  usedServiceRole: boolean
  needsAction: {
    pendingVendorApps: number
    pendingEventSubmissions: number
    newBookings: number
    bookingsNoVendorResponse: number
    trucksMissingPhotos: number
    eventsMissingImages: number
  }
  bookingSummary: {
    total: number
    openPipeline: number
    withVendorResponse: number
    needsFollowUp: number
  }
  vendorSummary: {
    activePublicTrucks: number
    pendingApplications: number
    trucksMissingPhotos: number
    hiddenOrInactive: number
    totalTrucks: number
  }
  eventSummary: {
    upcomingPublic: number
    pendingSubmissions: number
    activeMissingImages: number
  }
  recentActivity: AdminActivityItem[]
}

function isPendingEventRow(r: {
  active: boolean | null
  listing_status: string | null
  submitted_by_truck_id: string | null
}): boolean {
  if (r.active) return false
  if (r.listing_status === "rejected" || r.listing_status === "draft") return false
  if (r.listing_status === "pending") return true
  if (r.submitted_by_truck_id) return r.listing_status == null
  return false
}

function bookingTimingFromEmbed(
  raw: OpportunityBookingTiming | OpportunityBookingTiming[] | null | undefined
): OpportunityBookingTiming | null {
  const br = Array.isArray(raw) ? raw[0] : raw
  if (!br || typeof br !== "object") return null
  return br
}

function bookingNoVendorResponseCount(
  opps: {
    booking_request_id: string | null
    status: string | null
    expires_at?: string | null
    booking_requests?: OpportunityBookingTiming | OpportunityBookingTiming[] | null
  }[]
): number {
  const map = new Map<string, string[]>()
  for (const o of opps) {
    const booking = bookingTimingFromEmbed(o.booking_requests)
    if (
      !isOpportunityActiveAndActionable({
        status: o.status,
        expires_at: o.expires_at,
        booking,
      })
    ) {
      continue
    }
    const bid = o.booking_request_id
    if (!bid) continue
    const cur = map.get(bid) ?? []
    cur.push((o.status ?? "").toLowerCase())
    map.set(bid, cur)
  }
  let n = 0
  for (const statuses of map.values()) {
    if (statuses.length === 0) continue
    if (statuses.every((s) => s === "pending")) n += 1
  }
  return n
}

function distinctRespondedBookings(opps: { booking_request_id: string | null; status: string | null }[]): number {
  const ids = new Set<string>()
  for (const o of opps) {
    const bid = o.booking_request_id
    if (!bid) continue
    const s = (o.status ?? "").toLowerCase()
    if (s === "interested" || s === "pass" || s === "not_available") ids.add(bid)
  }
  return ids.size
}

export async function fetchAdminCommandCenterData(adminKeyForHref: string): Promise<AdminCommandCenterData> {
  const admin = createAdminSupabaseClient()
  const db = admin ?? (await createClient())
  const usedServiceRole = Boolean(admin)
  const keyQ = adminKeyForHref ? `?key=${encodeURIComponent(adminKeyForHref)}` : ""

  const today = easternDateStringToday()
  const OPEN_BOOKING_STATUSES = ["new", "contacted", "in_progress", "quoted"]

  const [
    bookingTotalHead,
    bookingNewHead,
    bookingOpenHead,
    pendingVendorHead,
    totalTrucksHead,
    upcomingPublicHead,
    oppsRes,
    recentBookingsRes,
    recentVendorRes,
    recentTrucksRes,
    recentEventsRes,
    directoryTrucksRes,
    eventsForPendingRes,
    activePublicTrucksHead,
  ] = await Promise.all([
    db.from("booking_requests").select("id", { count: "exact", head: true }),
    db.from("booking_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
    db.from("booking_requests").select("id", { count: "exact", head: true }).in("status", OPEN_BOOKING_STATUSES),
    db.from("vendor_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("trucks").select("id", { count: "exact", head: true }),
    db
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("active", true)
      .gte("date", today)
      .or(publicUpcomingEventsOrFilter()),
    db
      .from("truck_opportunities")
      .select(
        "booking_request_id, status, expires_at, created_at, id, truck_id, booking_requests(event_date, start_time, end_time, status)"
      )
      .limit(8000),
    /** Recent bookings: `booking_requests` has no `updated_at` — use `created_at` only. */
    db
      .from("booking_requests")
      .select("id, contact_name, status, created_at")
      .order("created_at", { ascending: false })
      .limit(14),
    /** Recent vendor applications: truck name is stored as `business_name` (not `truck_name`). */
    db
      .from("vendor_applications")
      .select("id, business_name, contact_name, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    db
      .from("trucks")
      .select("id, name, slug, show_in_directory, status, is_active, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(10),
    db
      .from("events")
      .select("id, title, active, listing_status, submitted_by_truck_id, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(14),
    db
      .from("trucks")
      .select("id, show_in_directory, status, is_active, photo_url")
      .eq("show_in_directory", true)
      .eq("status", "active")
      .eq("is_active", true)
      .limit(8000),
    db.from("events").select("id, active, listing_status, submitted_by_truck_id").limit(5000),
    db
      .from("trucks")
      .select("id", { count: "exact", head: true })
      .eq("show_in_directory", true)
      .eq("status", "active")
      .eq("is_active", true),
  ])

  if (oppsRes.error) console.error("[command-center] truck_opportunities:", oppsRes.error)
  if (recentBookingsRes.error) console.error("[command-center] booking_requests recent:", recentBookingsRes.error)
  if (recentVendorRes.error) console.error("[command-center] vendor_applications recent:", recentVendorRes.error)
  if (recentTrucksRes.error) console.error("[command-center] trucks recent:", recentTrucksRes.error)
  if (recentEventsRes.error) console.error("[command-center] events recent:", recentEventsRes.error)
  if (directoryTrucksRes.error) console.error("[command-center] directory trucks:", directoryTrucksRes.error)
  if (eventsForPendingRes.error) console.error("[command-center] events pending scan:", eventsForPendingRes.error)

  const oppRows = (oppsRes.data ?? []) as {
    booking_request_id: string | null
    status: string | null
    created_at: string | null
    id: string
    truck_id: string | null
    expires_at?: string | null
  }[]

  const bookingsNoVendorResponse = bookingNoVendorResponseCount(oppRows)
  const withVendorResponse = distinctRespondedBookings(oppRows)

  const directoryTrucks = (directoryTrucksRes.data ?? []) as { photo_url: string | null }[]
  const trucksMissingPhotos = directoryTrucks.filter((t) => !t.photo_url?.trim()).length

  const eventScan = (eventsForPendingRes.data ?? []) as {
    active: boolean | null
    listing_status: string | null
    submitted_by_truck_id: string | null
  }[]
  const pendingEventSubmissions = eventScan.filter(isPendingEventRow).length

  let eventsMissingImages = 0
  let activeMissingImages = 0
  const imgRes = await db.from("events").select("active, image_url, featured_image_url").limit(4000)
  if (!imgRes.error && imgRes.data) {
    for (const e of imgRes.data as {
      active: boolean | null
      image_url: string | null
      featured_image_url: string | null
    }[]) {
      const noImg = !e.image_url?.trim() && !e.featured_image_url?.trim()
      if (noImg) eventsMissingImages += 1
      if (e.active === true && noImg) activeMissingImages += 1
    }
  } else if (imgRes.error) {
    console.error("[command-center] events image scan:", imgRes.error)
  }

  const activePublicTrucks = activePublicTrucksHead.count ?? 0
  const totalTrucks = totalTrucksHead.count ?? 0
  const hiddenOrInactive = Math.max(0, totalTrucks - activePublicTrucks)

  const activities: AdminActivityItem[] = []

  for (const b of (recentBookingsRes.data ?? []) as {
    id: string
    contact_name: string | null
    status: string | null
    created_at: string
  }[]) {
    activities.push({
      id: b.id,
      kind: "booking",
      label: "Booking",
      title: (b.contact_name ?? "").trim() || "Booking request",
      at: b.created_at,
      status: b.status ?? null,
      href: `/admin/bookings/${b.id}${keyQ}`,
    })
  }

  for (const r of (recentVendorRes.data ?? []) as Record<string, unknown>[]) {
    const title =
      (r.business_name as string | undefined)?.trim() ||
      (r.contact_name as string | undefined)?.trim() ||
      "Vendor application"
    activities.push({
      id: String(r.id),
      kind: "vendor_application",
      label: "Vendor application",
      title,
      at: (r.created_at as string) ?? "",
      status: (r.status as string) ?? null,
      href: `/admin/vendors${keyQ}`,
    })
  }

  for (const t of (recentTrucksRes.data ?? []) as {
    id: string
    name: string | null
    show_in_directory: boolean | null
    status: string | null
    is_active: boolean | null
    created_at: string | null
    updated_at: string | null
  }[]) {
    const at =
      t.updated_at && t.created_at && new Date(t.updated_at) > new Date(t.created_at)
        ? t.updated_at
        : (t.created_at ?? "")
    activities.push({
      id: t.id,
      kind: "truck",
      label: "Truck",
      title: (t.name ?? "").trim() || "Truck listing",
      at,
      status: [t.status, t.show_in_directory ? "listed" : "not listed"].filter(Boolean).join(" · "),
      href: `/admin/vendors${keyQ}`,
    })
  }

  for (const e of (recentEventsRes.data ?? []) as {
    id: string
    title: string | null
    active: boolean | null
    listing_status: string | null
    submitted_by_truck_id: string | null
    created_at: string | null
    updated_at: string | null
  }[]) {
    const at =
      e.updated_at && e.created_at && new Date(e.updated_at) > new Date(e.created_at)
        ? e.updated_at
        : (e.created_at ?? "")
    activities.push({
      id: e.id,
      kind: "event",
      label: "Event",
      title: (e.title ?? "").trim() || "Event",
      at,
      status: isPendingEventRow(e) ? "pending" : e.active ? "live" : (e.listing_status ?? "—"),
      href: `/admin/events${keyQ}`,
    })
  }

  const oppSorted = [...oppRows].sort(
    (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  )
  for (const o of oppSorted.slice(0, 10)) {
    activities.push({
      id: o.id,
      kind: "opportunity",
      label: "Vendor opportunity",
      title: `Booking ${(o.booking_request_id ?? "").slice(0, 8)}… · ${o.status ?? "—"}`,
      at: o.created_at ?? "",
      status: o.status ?? null,
      href: o.booking_request_id ? `/admin/bookings/${o.booking_request_id}${keyQ}` : `/admin/bookings${keyQ}`,
    })
  }

  activities.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  const recentActivity = activities.slice(0, 22)

  return {
    usedServiceRole,
    needsAction: {
      pendingVendorApps: pendingVendorHead.count ?? 0,
      pendingEventSubmissions,
      newBookings: bookingNewHead.count ?? 0,
      bookingsNoVendorResponse,
      trucksMissingPhotos,
      eventsMissingImages,
    },
    bookingSummary: {
      total: bookingTotalHead.count ?? 0,
      openPipeline: bookingOpenHead.count ?? 0,
      withVendorResponse,
      needsFollowUp: bookingNewHead.count ?? 0,
    },
    vendorSummary: {
      activePublicTrucks,
      pendingApplications: pendingVendorHead.count ?? 0,
      trucksMissingPhotos,
      hiddenOrInactive,
      totalTrucks,
    },
    eventSummary: {
      upcomingPublic: upcomingPublicHead.count ?? 0,
      pendingSubmissions: pendingEventSubmissions,
      activeMissingImages,
    },
    recentActivity,
  }
}
