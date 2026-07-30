import assert from "node:assert/strict"
import test from "node:test"
import { filterEligibleTrucksForBroadcast } from "@/lib/booking/eligible-trucks-for-opportunities"
import { VENDOR_NEED } from "@/lib/booking/vendor-need"

const iceCream = {
  id: "ice-1",
  name: "Dairy Barn Ice Cream Shoppe",
  vendor_type: "truck",
  cuisine: "Desserts / Sweets",
  cuisine_types: ["Desserts / Sweets"],
}

const mealTruck = {
  id: "meal-1",
  name: "Queen City BBQ",
  vendor_type: "truck",
  cuisine: "BBQ / Smokehouse",
  cuisine_types: ["BBQ / Smokehouse"],
}

const coffeeOnly = {
  id: "coffee-1",
  name: "Morning Bell Coffee",
  vendor_type: "coffee_cart",
  cuisine: "Coffee / Drinks",
  cuisine_types: ["Coffee / Drinks"],
}

const beverageOnly = {
  id: "bev-1",
  name: "Fresh Press Lemonade",
  vendor_type: "beverage_vendor",
  cuisine: "Juice / Smoothies",
  cuisine_types: ["Juice / Smoothies"],
}

const allTrucks = [iceCream, mealTruck, coffeeOnly, beverageOnly]

test("ice cream vendor excluded from general office lunch open request", () => {
  const ids = filterEligibleTrucksForBroadcast(allTrucks, {
    requestType: "open_request",
    cuisines: null,
    vendorType: "any",
    vendorNeed: VENDOR_NEED.MEAL,
    requestText: "Office lunch catering for 80 guests",
  }).map((t) => t.id)

  assert.ok(ids.includes("meal-1"))
  assert.equal(ids.includes("ice-1"), false)
})

test("ice cream vendor included when vendor need is Dessert / ice cream / sweet treats", () => {
  const ids = filterEligibleTrucksForBroadcast(allTrucks, {
    requestType: "open_request",
    cuisines: null,
    vendorType: "any",
    vendorNeed: VENDOR_NEED.DESSERT,
    requestText: null,
  }).map((t) => t.id)

  assert.ok(ids.includes("ice-1"))
  assert.equal(ids.includes("meal-1"), false)
})

test("ice cream vendor included when selected cuisine is Desserts / Sweets", () => {
  const ids = filterEligibleTrucksForBroadcast(allTrucks, {
    requestType: "cuisine_match",
    cuisines: ["Desserts / Sweets"],
    vendorType: "any",
    vendorNeed: VENDOR_NEED.MULTIPLE,
    requestText: null,
  }).map((t) => t.id)

  assert.ok(ids.includes("ice-1"))
  assert.equal(ids.includes("meal-1"), false)
})

test("ice cream vendor included when notes mention ice cream or dessert", () => {
  const ids = filterEligibleTrucksForBroadcast(allTrucks, {
    requestType: "open_request",
    cuisines: null,
    vendorType: "any",
    vendorNeed: VENDOR_NEED.MULTIPLE,
    requestText: "Looking for an ice cream truck for a birthday party",
  }).map((t) => t.id)

  assert.ok(ids.includes("ice-1"))
  assert.ok(ids.includes("meal-1"))
})

test("meal truck still included in general open request", () => {
  const ids = filterEligibleTrucksForBroadcast(allTrucks, {
    requestType: "open_request",
    cuisines: null,
    vendorType: null,
    vendorNeed: VENDOR_NEED.MEAL,
    requestText: "General food truck request for guests",
  }).map((t) => t.id)

  assert.ok(ids.includes("meal-1"))
})

test("coffee-only vendor excluded from general lunch", () => {
  const ids = filterEligibleTrucksForBroadcast(allTrucks, {
    requestType: "open_request",
    cuisines: null,
    vendorType: "any",
    vendorNeed: VENDOR_NEED.MEAL,
    requestText: "Office lunch",
  }).map((t) => t.id)

  assert.equal(ids.includes("coffee-1"), false)
})

test("coffee-only vendor included when vendor need or notes mention coffee/breakfast/drinks", () => {
  const byNeed = filterEligibleTrucksForBroadcast(allTrucks, {
    requestType: "open_request",
    cuisines: null,
    vendorType: "any",
    vendorNeed: VENDOR_NEED.COFFEE,
    requestText: null,
  }).map((t) => t.id)
  assert.ok(byNeed.includes("coffee-1"))

  const byNotes = filterEligibleTrucksForBroadcast(allTrucks, {
    requestType: "open_request",
    cuisines: null,
    vendorType: "any",
    vendorNeed: VENDOR_NEED.MULTIPLE,
    requestText: "Need coffee and breakfast for a morning event",
  }).map((t) => t.id)
  assert.ok(byNotes.includes("coffee-1"))
})

test("beverage-only vendor excluded from general meal request", () => {
  const ids = filterEligibleTrucksForBroadcast(allTrucks, {
    requestType: "open_request",
    cuisines: null,
    vendorType: "any",
    vendorNeed: VENDOR_NEED.MEAL,
    requestText: "Meal catering for dinner",
  }).map((t) => t.id)

  assert.equal(ids.includes("bev-1"), false)
  assert.ok(ids.includes("meal-1"))
})

test("Open to multiple types does not automatically include dessert-only vendors unless dessert is selected or mentioned", () => {
  const withoutDessert = filterEligibleTrucksForBroadcast(allTrucks, {
    requestType: "open_request",
    cuisines: null,
    vendorType: "any",
    vendorNeed: VENDOR_NEED.MULTIPLE,
    requestText: "Food for guests at a community event",
  }).map((t) => t.id)

  assert.ok(withoutDessert.includes("meal-1"))
  assert.equal(withoutDessert.includes("ice-1"), false)

  const withDessertMention = filterEligibleTrucksForBroadcast(allTrucks, {
    requestType: "open_request",
    cuisines: null,
    vendorType: "any",
    vendorNeed: VENDOR_NEED.MULTIPLE,
    requestText: "Also want dessert for after the meal",
  }).map((t) => t.id)

  assert.ok(withDessertMention.includes("ice-1"))
})
