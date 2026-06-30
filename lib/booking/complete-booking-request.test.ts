import assert from "node:assert/strict"
import test from "node:test"
import {
  buildAdminBookingNotificationUrl,
  resolveProductionSiteBaseUrl,
} from "@/lib/booking/complete-booking-request"

const ENV_KEYS = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SITE_URL",
  "PUBLIC_SITE_URL",
  "ADMIN_KEY",
] as const

type EnvSnapshot = Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>

function withEnv(overrides: EnvSnapshot, fn: () => void): void {
  const saved: EnvSnapshot = {}
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key]
    if (key in overrides) {
      const value = overrides[key]
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
  try {
    fn()
  } finally {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key]
      else process.env[key] = saved[key]
    }
  }
}

const SAMPLE_BOOKING_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"

test("resolveProductionSiteBaseUrl prefers NEXT_PUBLIC_APP_URL and strips trailing slashes", () => {
  withEnv(
    {
      NEXT_PUBLIC_APP_URL: "https://app.example.com///",
      NEXT_PUBLIC_SITE_URL: "https://site.example.com",
      PUBLIC_SITE_URL: "https://public.example.com",
    },
    () => {
      assert.equal(resolveProductionSiteBaseUrl(), "https://app.example.com")
    }
  )
})

test("resolveProductionSiteBaseUrl falls back through SITE_URL env vars then production default", () => {
  withEnv(
    {
      NEXT_PUBLIC_APP_URL: "",
      NEXT_PUBLIC_SITE_URL: "https://site.example.com/",
      PUBLIC_SITE_URL: "https://public.example.com",
    },
    () => {
      assert.equal(resolveProductionSiteBaseUrl(), "https://site.example.com")
    }
  )

  withEnv(
    {
      NEXT_PUBLIC_APP_URL: undefined,
      NEXT_PUBLIC_SITE_URL: undefined,
      PUBLIC_SITE_URL: "https://public.example.com",
    },
    () => {
      assert.equal(resolveProductionSiteBaseUrl(), "https://public.example.com")
    }
  )

  withEnv(
    {
      NEXT_PUBLIC_APP_URL: undefined,
      NEXT_PUBLIC_SITE_URL: undefined,
      PUBLIC_SITE_URL: undefined,
    },
    () => {
      assert.equal(resolveProductionSiteBaseUrl(), "https://www.foodtruckclt.com")
    }
  )
})

test("buildAdminBookingNotificationUrl includes encoded admin key on booking detail route", () => {
  withEnv({ ADMIN_KEY: "key/with+special&chars=1" }, () => {
    const url = buildAdminBookingNotificationUrl(SAMPLE_BOOKING_ID)
    assert.equal(
      url,
      `https://www.foodtruckclt.com/admin/bookings/${SAMPLE_BOOKING_ID}?key=${encodeURIComponent("key/with+special&chars=1")}`
    )
    assert.match(url, /\?key=key%2Fwith%2Bspecial%26chars%3D1$/)
    assert.doesNotMatch(url, /key\/with\+special/)
  })
})

test("buildAdminBookingNotificationUrl uses configured base URL with booking id and key query", () => {
  withEnv(
    {
      NEXT_PUBLIC_APP_URL: "https://www.foodtruckclt.com",
      ADMIN_KEY: "6077850124",
    },
    () => {
      const url = buildAdminBookingNotificationUrl(SAMPLE_BOOKING_ID)
      assert.equal(
        url,
        `https://www.foodtruckclt.com/admin/bookings/${SAMPLE_BOOKING_ID}?key=6077850124`
      )
    }
  )
})

test("buildAdminBookingNotificationUrl falls back to generic admin bookings when ADMIN_KEY is unset", () => {
  withEnv({ ADMIN_KEY: undefined }, () => {
    assert.equal(
      buildAdminBookingNotificationUrl(SAMPLE_BOOKING_ID),
      "https://www.foodtruckclt.com/admin/bookings"
    )
  })
})

test("buildAdminBookingNotificationUrl does not embed raw admin key in path segments", () => {
  withEnv({ ADMIN_KEY: "secret-admin-key-value" }, () => {
    const url = buildAdminBookingNotificationUrl(SAMPLE_BOOKING_ID)
    assert.ok(url.includes("?key="))
    assert.ok(!url.includes("/admin/bookings/secret-admin-key-value"))
    assert.equal(url.split("?key=")[0], `https://www.foodtruckclt.com/admin/bookings/${SAMPLE_BOOKING_ID}`)
  })
})
