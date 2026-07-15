import assert from "node:assert/strict"
import test from "node:test"
import {
  filterActivePendingOpportunities,
  opportunityVisibleInRequestsToConfirm,
  pickVendorTruckForAuthEmail,
  type TruckOpportunityRow,
  type VendorDashboardTruck,
} from "@/lib/dashboard/vendor-booking-opportunities"
import { authEmailMatchesTruck } from "@/lib/dashboard/vendor-booking-opportunity-visibility"
import {
  buildVendorLoginRedirectForDashboardOpportunity,
  resolvePendingDeepLinkOpportunity,
  resolveVendorLoginCallbackNext,
} from "@/lib/dashboard/vendor-dashboard-opportunity-link"
import { buildVendorDashboardOpportunityPath } from "@/lib/email/vendor-opportunity-dashboard-url"

const OFFICIAL_TEST_TRUCK: VendorDashboardTruck = {
  id: "9897687c-0687-4b2b-86c2-db54d80c25ce",
  name: "official test truck",
  slug: "official-test-truck",
  email: "evolvebtc@gmail.com",
  cuisine: null,
  cuisine_types: null,
  serving_today: null,
  serving_started_at: null,
  today_location: null,
  street_address: null,
  latitude: null,
  longitude: null,
  updated_at: null,
}

const DEMO_VENDOR_TRUCK: VendorDashboardTruck = {
  id: "e9223cdf-e8b2-4d71-9ba3-d8230b59337a",
  name: "FoodTruckCLT Demo Vendor",
  slug: "demo-vendor",
  email: "evolvebtc@icloud.com",
  cuisine: null,
  cuisine_types: null,
  serving_today: null,
  serving_started_at: null,
  today_location: null,
  street_address: null,
  latitude: null,
  longitude: null,
  updated_at: null,
}

const PUBLIC_OTHER_TRUCKS: VendorDashboardTruck[] = Array.from({ length: 8 }, (_, i) => ({
  id: `public-truck-${i}`,
  name: `Public Truck ${i}`,
  slug: `public-${i}`,
  email: `public${i}@example.com`,
  cuisine: null,
  cuisine_types: null,
  serving_today: null,
  serving_started_at: null,
  today_location: null,
  street_address: null,
  latitude: null,
  longitude: null,
  updated_at: null,
}))

function pendingOpp(opts: {
  id: string
  truckId: string
  expiresAt: string
  status?: string
  bookingStatus?: string
}): TruckOpportunityRow {
  return {
    id: opts.id,
    status: opts.status ?? "pending",
    truck_id: opts.truckId,
    booking_request_id: "0997be51-8503-4ddf-a098-114a45d60c00",
    created_at: "2026-07-15T12:00:00.000Z",
    expires_at: opts.expiresAt,
    booking_requests: {
      status: opts.bookingStatus ?? "new",
      event_date: "2026-07-15",
      start_time: "12:00",
      end_time: "14:00",
      contact_email: "host@example.com",
      additional_notes: null,
    },
  }
}

test("pickVendorTruckForAuthEmail matches gmail truck by authenticated email directly", () => {
  /** Simulates a query filtered by email — not an arbitrary first-5 public page. */
  const picked = pickVendorTruckForAuthEmail([OFFICIAL_TEST_TRUCK], "evolvebtc@gmail.com")
  assert.equal(picked.truck?.id, "9897687c-0687-4b2b-86c2-db54d80c25ce")
  assert.equal(picked.resolutionNote, null)
})

test("pickVendorTruckForAuthEmail matches icloud truck by authenticated email directly", () => {
  const picked = pickVendorTruckForAuthEmail([DEMO_VENDOR_TRUCK], "evolvebtc@icloud.com")
  assert.equal(picked.truck?.id, "e9223cdf-e8b2-4d71-9ba3-d8230b59337a")
})

test("auth email matching is case-insensitive and trimmed", () => {
  assert.equal(authEmailMatchesTruck("  EvolveBTC@Gmail.COM  ", "evolvebtc@gmail.com"), true)
  assert.equal(authEmailMatchesTruck("evolvebtc@icloud.com", "  EvolveBTC@iCloud.COM "), true)
  assert.equal(authEmailMatchesTruck("evolvebtc@gmail.com", "evolvebtc@icloud.com"), false)

  const picked = pickVendorTruckForAuthEmail(
    [{ ...OFFICIAL_TEST_TRUCK, email: "EvolveBTC@Gmail.COM" }],
    "  evolvebtc@gmail.com  "
  )
  assert.equal(picked.truck?.id, OFFICIAL_TEST_TRUCK.id)
})

test("legacy limit(5) public scan would miss the matching truck — email-direct pick still works", () => {
  /** Old bug: first 5 public rows never included the vendor truck. */
  const brittleScan = [...PUBLIC_OTHER_TRUCKS.slice(0, 5), OFFICIAL_TEST_TRUCK]
  const onlyFirstFive = brittleScan.slice(0, 5)
  assert.equal(pickVendorTruckForAuthEmail(onlyFirstFive, "evolvebtc@gmail.com").truck, null)

  const emailDirect = pickVendorTruckForAuthEmail([OFFICIAL_TEST_TRUCK], "evolvebtc@gmail.com")
  assert.equal(emailDirect.truck?.id, OFFICIAL_TEST_TRUCK.id)
})

test("pending opportunities show for the matching truck", () => {
  const futureExpiry = "2099-07-15T18:00:00.000Z"
  const rows = [
    pendingOpp({
      id: "c12f78b0-6a0d-4681-a205-2bc1a7a894e6",
      truckId: OFFICIAL_TEST_TRUCK.id,
      expiresAt: futureExpiry,
    }),
  ]
  const active = filterActivePendingOpportunities(rows, OFFICIAL_TEST_TRUCK)
  assert.equal(active.length, 1)
  assert.equal(active[0]?.id, "c12f78b0-6a0d-4681-a205-2bc1a7a894e6")
  assert.equal(
    opportunityVisibleInRequestsToConfirm(
      "pending",
      {
        status: "new",
        event_date: "2026-07-15",
        start_time: "12:00",
        end_time: "14:00",
      },
      OFFICIAL_TEST_TRUCK,
      futureExpiry
    ),
    true
  )
})

test("expired opportunities do not show in active requests", () => {
  const pastExpiry = "2020-01-01T18:00:00.000Z"
  const rows = [
    pendingOpp({
      id: "c12f78b0-6a0d-4681-a205-2bc1a7a894e6",
      truckId: OFFICIAL_TEST_TRUCK.id,
      expiresAt: pastExpiry,
    }),
  ]
  const active = filterActivePendingOpportunities(rows, OFFICIAL_TEST_TRUCK)
  assert.equal(active.length, 0)
})

test("non-pending opportunities do not show in active requests", () => {
  const futureExpiry = "2099-07-15T18:00:00.000Z"
  const rows = [
    pendingOpp({
      id: "interested-opp",
      truckId: OFFICIAL_TEST_TRUCK.id,
      expiresAt: futureExpiry,
      status: "interested",
    }),
    pendingOpp({
      id: "unavailable-opp",
      truckId: OFFICIAL_TEST_TRUCK.id,
      expiresAt: futureExpiry,
      status: "not_available",
    }),
  ]
  assert.equal(filterActivePendingOpportunities(rows, OFFICIAL_TEST_TRUCK).length, 0)
})

test("one vendor cannot see another vendor opportunity via truck-scoped filter", () => {
  const futureExpiry = "2099-07-15T18:00:00.000Z"
  const gmailOpp = pendingOpp({
    id: "c12f78b0-6a0d-4681-a205-2bc1a7a894e6",
    truckId: OFFICIAL_TEST_TRUCK.id,
    expiresAt: futureExpiry,
  })
  const icloudOpp = pendingOpp({
    id: "6cc85079-5e46-4b8f-808a-d7a1409457d4",
    truckId: DEMO_VENDOR_TRUCK.id,
    expiresAt: futureExpiry,
  })

  /**
   * Production isolation: fetchVendorPendingOpportunities queries `.eq("truck_id", truck.id)`.
   * Simulate that scope here — each vendor only receives their own opportunity rows.
   */
  function opportunitiesForTruck(
    all: TruckOpportunityRow[],
    truck: VendorDashboardTruck
  ): TruckOpportunityRow[] {
    return all.filter((o) => o.truck_id === truck.id)
  }

  const all = [gmailOpp, icloudOpp]
  const gmailScoped = opportunitiesForTruck(all, OFFICIAL_TEST_TRUCK)
  const icloudScoped = opportunitiesForTruck(all, DEMO_VENDOR_TRUCK)

  assert.deepEqual(
    filterActivePendingOpportunities(gmailScoped, OFFICIAL_TEST_TRUCK).map((o) => o.id),
    [gmailOpp.id]
  )
  assert.deepEqual(
    filterActivePendingOpportunities(icloudScoped, DEMO_VENDOR_TRUCK).map((o) => o.id),
    [icloudOpp.id]
  )
  assert.equal(gmailScoped.some((o) => o.id === icloudOpp.id), false)
  assert.equal(icloudScoped.some((o) => o.id === gmailOpp.id), false)

  assert.equal(pickVendorTruckForAuthEmail([OFFICIAL_TEST_TRUCK], "evolvebtc@icloud.com").truck, null)
  assert.equal(pickVendorTruckForAuthEmail([DEMO_VENDOR_TRUCK], "evolvebtc@gmail.com").truck, null)
})

test("deep-linked opportunity opens only when pending and present for the resolved truck list", () => {
  const futureExpiry = "2099-07-15T18:00:00.000Z"
  const gmailOpp = pendingOpp({
    id: "c12f78b0-6a0d-4681-a205-2bc1a7a894e6",
    truckId: OFFICIAL_TEST_TRUCK.id,
    expiresAt: futureExpiry,
  })
  const icloudOpp = pendingOpp({
    id: "6cc85079-5e46-4b8f-808a-d7a1409457d4",
    truckId: DEMO_VENDOR_TRUCK.id,
    expiresAt: futureExpiry,
  })

  const gmailPending = filterActivePendingOpportunities([gmailOpp], OFFICIAL_TEST_TRUCK)
  assert.deepEqual(
    resolvePendingDeepLinkOpportunity(gmailPending, "c12f78b0-6a0d-4681-a205-2bc1a7a894e6")?.id,
    gmailOpp.id
  )
  /** Wrong truck's opportunity id is not in this vendor's pending list. */
  assert.equal(
    resolvePendingDeepLinkOpportunity(gmailPending, "6cc85079-5e46-4b8f-808a-d7a1409457d4"),
    null
  )

  const expiredOnly = filterActivePendingOpportunities(
    [pendingOpp({ id: gmailOpp.id, truckId: OFFICIAL_TEST_TRUCK.id, expiresAt: "2020-01-01T00:00:00.000Z" })],
    OFFICIAL_TEST_TRUCK
  )
  assert.equal(resolvePendingDeepLinkOpportunity(expiredOnly, gmailOpp.id), null)

  const interested = filterActivePendingOpportunities(
    [
      pendingOpp({
        id: gmailOpp.id,
        truckId: OFFICIAL_TEST_TRUCK.id,
        expiresAt: futureExpiry,
        status: "interested",
      }),
    ],
    OFFICIAL_TEST_TRUCK
  )
  assert.equal(resolvePendingDeepLinkOpportunity(interested, gmailOpp.id), null)
  assert.ok(icloudOpp.id)
})

test("login next URL is safe and preserved for opportunity deep links", () => {
  const oppId = "c12f78b0-6a0d-4681-a205-2bc1a7a894e6"
  const redirectPath = buildVendorLoginRedirectForDashboardOpportunity(oppId)
  assert.equal(
    redirectPath,
    `/vendor-login?next=${encodeURIComponent(buildVendorDashboardOpportunityPath(oppId))}`
  )
  const next = buildVendorDashboardOpportunityPath(oppId)
  assert.equal(resolveVendorLoginCallbackNext(next, "/dashboard"), next)
  assert.equal(resolveVendorLoginCallbackNext("https://evil.example", "/dashboard"), "/dashboard")
  assert.equal(resolveVendorLoginCallbackNext("//evil.example", "/dashboard"), "/dashboard")
})
