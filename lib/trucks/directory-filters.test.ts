import assert from "node:assert/strict"
import test from "node:test"
import {
  getMatchingCuisineCategories,
  matchesCuisineCategory,
  type DirectoryFilterTruck,
} from "./directory-filters"

function truck(partial: Partial<DirectoryFilterTruck> & { name: string }): DirectoryFilterTruck {
  return {
    cuisine: null,
    cuisine_types: null,
    ...partial,
  }
}

test("Jamaican / Caribbean maps from cuisine_types and free-text", () => {
  const fromType = truck({ name: "Island Eats", cuisine_types: ["Caribbean"] })
  assert.ok(getMatchingCuisineCategories(fromType).includes("caribbean"))
  assert.equal(matchesCuisineCategory(fromType, "caribbean"), true)

  const fromText = truck({ name: "Jerk Spot", cuisine: "Jamaican" })
  assert.ok(getMatchingCuisineCategories(fromText).includes("caribbean"))

  const fromJerk = truck({
    name: "Smoke & Jerk",
    short_description: "Authentic jerk chicken and Caribbean sides",
  })
  assert.ok(getMatchingCuisineCategories(fromJerk).includes("caribbean"))
})

test("Indian maps from Indian / Curry label and related keywords", () => {
  const fromType = truck({ name: "Spice Route", cuisine_types: ["Indian / Curry"] })
  assert.ok(getMatchingCuisineCategories(fromType).includes("indian"))
  assert.equal(matchesCuisineCategory(fromType, "indian"), true)

  const fromText = truck({ name: "Naan House", cuisine: "Indian, Tikka Masala" })
  assert.ok(getMatchingCuisineCategories(fromText).includes("indian"))
})

test("Coffee / drinks maps from juice, lemonade, boba, and coffee signals", () => {
  const juice = truck({ name: "Fresh Press", cuisine_types: ["Juice / Smoothies"] })
  assert.ok(getMatchingCuisineCategories(juice).includes("coffee"))
  assert.ok(getMatchingCuisineCategories(juice).includes("healthy"))

  const coffee = truck({ name: "Morning Bell", cuisine: "Coffee" })
  assert.ok(getMatchingCuisineCategories(coffee).includes("coffee"))

  const lemonade = truck({
    name: "Sip Co",
    today_specials: "Fresh lemonade and iced tea",
  })
  assert.ok(getMatchingCuisineCategories(lemonade).includes("coffee"))

  const boba = truck({ name: "Bubble Stop", tagline: "Boba and espresso drinks" })
  assert.ok(getMatchingCuisineCategories(boba).includes("coffee"))
})

test("Dessert maps from Desserts / Sweets and snow cones", () => {
  const sweets = truck({ name: "Sweet Route", cuisine_types: ["Desserts / Sweets"] })
  assert.ok(getMatchingCuisineCategories(sweets).includes("desserts"))

  const snow = truck({ name: "Ice Dream", cuisine_types: ["Snow Cones / Slushies"] })
  assert.ok(getMatchingCuisineCategories(snow).includes("desserts"))

  const iceCream = truck({ name: "Cone Co", cuisine: "Ice cream and cookies" })
  assert.ok(getMatchingCuisineCategories(iceCream).includes("desserts"))
})

test("Latin American maps Cuban, Puerto Rican, Colombian, arepas, empanadas", () => {
  const colombian = truck({ name: "Arepa Cart", cuisine_types: ["Latin / Colombian"] })
  assert.ok(getMatchingCuisineCategories(colombian).includes("latin"))

  const cuban = truck({ name: "Havana Bites", cuisine: "Cuban sandwiches" })
  assert.ok(getMatchingCuisineCategories(cuban).includes("latin"))

  const pr = truck({
    name: "Boricua Kitchen",
    short_description: "Puerto Rican comfort plates and empanadas",
  })
  assert.ok(getMatchingCuisineCategories(pr).includes("latin"))

  const arepa = truck({ name: "Arepa House", cuisine: "Venezuelan arepas" })
  assert.ok(getMatchingCuisineCategories(arepa).includes("latin"))
})

test("Burgers / sandwiches maps American / Burgers and Sandwiches / Wraps", () => {
  const americanBurgers = truck({
    name: "Smash Co",
    cuisine_types: ["American / Burgers"],
  })
  const cats = getMatchingCuisineCategories(americanBurgers)
  assert.ok(cats.includes("burgers"))
  assert.ok(cats.includes("american"))

  const wraps = truck({ name: "Wrap It", cuisine_types: ["Sandwiches / Wraps"] })
  assert.ok(getMatchingCuisineCategories(wraps).includes("burgers"))

  const cheesesteak = truck({ name: "Philly Run", cuisine: "Cheesesteaks and subs" })
  assert.ok(getMatchingCuisineCategories(cheesesteak).includes("burgers"))
})

test("Multiple cuisines can match multiple filters", () => {
  const multi = truck({
    name: "Fusion Truck",
    cuisine_types: ["Mexican / Tacos", "Vegetarian / Vegan"],
    short_description: "Plant-based tacos and bowls",
  })
  const cats = getMatchingCuisineCategories(multi)
  assert.ok(cats.includes("tacos"))
  assert.ok(cats.includes("vegan_veg"))
  assert.ok(cats.includes("healthy"))
  assert.equal(matchesCuisineCategory(multi, "tacos"), true)
  assert.equal(matchesCuisineCategory(multi, "vegan_veg"), true)
  assert.equal(matchesCuisineCategory(multi, "healthy"), true)
  assert.equal(matchesCuisineCategory(multi, "other"), false)
})

test("BBQ and chicken structured labels map correctly", () => {
  const bbq = truck({ name: "Smoke Ring", cuisine_types: ["BBQ / Smokehouse"] })
  assert.ok(getMatchingCuisineCategories(bbq).includes("bbq"))

  const wings = truck({ name: "Wing Lab", cuisine_types: ["Wings / Chicken"] })
  assert.ok(getMatchingCuisineCategories(wings).includes("chicken"))
})

test("Other only when no confident category match", () => {
  const unknown = truck({ name: "Mystery Cart", cuisine: "Event catering" })
  assert.deepEqual(getMatchingCuisineCategories(unknown), [])
  assert.equal(matchesCuisineCategory(unknown, "other"), true)
  assert.equal(matchesCuisineCategory(unknown, "bbq"), false)
})

test("Default browse (no cuisine filter) does not hide trucks", () => {
  const any = truck({ name: "Any Truck", cuisine: null, cuisine_types: [] })
  assert.equal(matchesCuisineCategory(any, null), true)
  assert.equal(matchesCuisineCategory(any, ""), true)
})
