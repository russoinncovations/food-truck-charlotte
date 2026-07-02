import assert from "node:assert/strict"
import test from "node:test"
import { BOOKING_REQUEST_TYPE } from "@/lib/booking/booking-request-constants"
import {
  buildOrganizerInterestedHandoffEmail,
  buildOrganizerInterestedHandoffSubject,
} from "@/lib/email/booking-organizer-interested-handoff-email"

test("buildOrganizerInterestedHandoffSubject includes truck and event context", () => {
  assert.match(
    buildOrganizerInterestedHandoffSubject(
      { event_type: "corporate", event_date: "2026-08-01" },
      "Taco Truck CLT"
    ),
    /Taco Truck CLT/
  )
})

test("buildOrganizerInterestedHandoffEmail includes truck contact details and direct communication disclaimer", () => {
  const { html, text } = buildOrganizerInterestedHandoffEmail({
    booking: {
      event_type: "corporate",
      event_date: "2026-08-01",
      city: "Charlotte",
      contact_name: "Jordan Host",
      venue_name: "Romare Bearden Park",
    },
    truck: {
      name: "Taco Truck CLT",
      slug: "taco-truck-clt",
      cuisine: "Mexican",
      cuisine_types: ["Mexican / Tacos"],
      short_description: "Charlotte tacos for events.",
      description: null,
      booking_email: "book@tacotruckclt.com",
      booking_phone: "704-555-1212",
      website: "https://tacotruckclt.com",
      instagram: "tacotruckclt",
    },
    profileUrl: "https://www.foodtruckclt.com/trucks/taco-truck-clt",
  })

  assert.match(html, /book@tacotruckclt\.com/)
  assert.match(text, /704-555-1212/)
  assert.match(html, /instagram\.com\/tacotruckclt/i)
  assert.match(html, /does not handle payment or contracting/i)
  assert.match(text, /FoodTruckCLT profile: https:\/\/www\.foodtruckclt\.com\/trucks\/taco-truck-clt/)
})

test("buildOrganizerInterestedHandoffEmail uses cuisine types when available", () => {
  const { text } = buildOrganizerInterestedHandoffEmail({
    booking: {
      event_type: "wedding",
      event_date: "2026-09-10",
      city: "Charlotte",
      contact_name: "Sam",
      venue_name: null,
    },
    truck: {
      name: "Smokehouse Cart",
      slug: null,
      cuisine: "BBQ",
      cuisine_types: ["BBQ / Smokehouse"],
      short_description: null,
      description: "BBQ cart for private events.",
      booking_email: null,
      booking_phone: "704-555-3434",
      website: null,
      instagram: null,
    },
    profileUrl: "https://www.foodtruckclt.com/trucks",
  })

  assert.match(text, /Cuisine: BBQ \/ Smokehouse/)
})
