import assert from "node:assert/strict"
import test from "node:test"
import {
  buildOrganizerInterestedHandoffEmail,
  buildOrganizerInterestedHandoffSubject,
} from "@/lib/email/booking-organizer-interested-handoff-email"

test("buildOrganizerInterestedHandoffSubject includes truck and good-news framing", () => {
  const subject = buildOrganizerInterestedHandoffSubject(
    { event_type: "corporate", event_date: "2026-08-01" },
    "Taco Truck CLT"
  )
  assert.match(subject, /Good news/i)
  assert.match(subject, /Taco Truck CLT/)
})

test("buildOrganizerInterestedHandoffEmail includes required host copy and truck contact details", () => {
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
      contact_email: "book@tacotruckclt.com",
      contact_phone: "704-555-1212",
    },
    profileUrl: "https://www.foodtruckclt.com/trucks/taco-truck-clt",
  })

  assert.match(html, /Good news, a food truck is interested in your event/i)
  assert.match(
    text,
    /The truck may contact you directly using the event contact information you provided/i
  )
  assert.match(html, /book@tacotruckclt\.com/)
  assert.match(text, /704-555-1212/)
  assert.match(html, /Mexican \/ Tacos/)
  assert.match(html, /trucks\/taco-truck-clt/)
  assert.match(
    text,
    /FoodTruckCLT does not manage the final booking, pricing, contract, payment, or event logistics/i
  )
  assert.doesNotMatch(html, /vendor\.foodtruckclt|\/dashboard/i)
})

test("buildOrganizerInterestedHandoffEmail omits missing email and phone lines", () => {
  const { html, text } = buildOrganizerInterestedHandoffEmail({
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
      contact_email: null,
      contact_phone: null,
    },
    profileUrl: "https://www.foodtruckclt.com/trucks",
  })

  assert.doesNotMatch(html, /Contact email:/i)
  assert.doesNotMatch(text, /^Phone:/m)
  assert.match(text, /Cuisine \/ category: BBQ \/ Smokehouse/)
  assert.match(html, /Profile:/i)
})
