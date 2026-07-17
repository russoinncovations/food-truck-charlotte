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

test("Italian ice maps to Desserts / Sweets and not Italian / Pizza", () => {
  const italianIce = truck({ name: "Ice Cart", cuisine: "Italian ice" })
  const cats = getMatchingCuisineCategories(italianIce)
  assert.ok(cats.includes("desserts"))
  assert.equal(cats.includes("italian"), false)

  const slush = truck({
    name: "Slush Stop",
    cuisine: "Italian ice and slushies",
  })
  const slushCats = getMatchingCuisineCategories(slush)
  assert.ok(slushCats.includes("desserts"))
  assert.equal(slushCats.includes("italian"), false)
})

test("Donuts map to Desserts / Sweets and not Coffee / Drinks", () => {
  const donuts = truck({ name: "Holey", cuisine: "Donuts" })
  const cats = getMatchingCuisineCategories(donuts)
  assert.ok(cats.includes("desserts"))
  assert.equal(cats.includes("coffee"), false)
})

test("Churros map to Desserts / Sweets and Latin American, not Coffee / Drinks", () => {
  const churros = truck({ name: "Churro Co", cuisine: "Churros" })
  const cats = getMatchingCuisineCategories(churros)
  assert.ok(cats.includes("desserts"))
  assert.ok(cats.includes("latin"))
  assert.equal(cats.includes("coffee"), false)
})

test("Pizza maps to Italian / Pizza", () => {
  const pizza = truck({ name: "Slice", cuisine_types: ["Pizza"] })
  assert.ok(getMatchingCuisineCategories(pizza).includes("italian"))

  const pasta = truck({ name: "Pasta Night", cuisine: "Pasta" })
  assert.ok(getMatchingCuisineCategories(pasta).includes("italian"))
})

test("Coffee/espresso maps to Coffee / Drinks", () => {
  const coffee = truck({ name: "Morning Bell", cuisine: "Coffee" })
  assert.ok(getMatchingCuisineCategories(coffee).includes("coffee"))

  const espresso = truck({ name: "Steam Cart", cuisine: "Espresso and latte" })
  assert.ok(getMatchingCuisineCategories(espresso).includes("coffee"))
})

test("Lemonade/boba/tea maps to Coffee / Drinks", () => {
  const lemonade = truck({
    name: "Sip Co",
    today_specials: "Fresh lemonade and iced tea",
  })
  assert.ok(getMatchingCuisineCategories(lemonade).includes("coffee"))

  const boba = truck({ name: "Bubble Stop", tagline: "Boba and espresso" })
  assert.ok(getMatchingCuisineCategories(boba).includes("coffee"))
})

test("A pizza truck with cannoli does not match Coffee / Drinks", () => {
  const pizza = truck({
    name: "Nonna Slice",
    cuisine_types: ["Pizza"],
    short_description: "Wood-fired pizza and cannoli",
    full_description: "Pair your slice with fountain drinks",
  })
  const cats = getMatchingCuisineCategories(pizza)
  assert.ok(cats.includes("italian"))
  assert.equal(cats.includes("coffee"), false)
  // Cannoli is only in short_description; structured Pizza is enough — no dessert stretch required.
})

test("A dessert truck mentioning drinks once does not match Coffee / Drinks", () => {
  const dessert = truck({
    name: "Sweet Route",
    cuisine_types: ["Desserts / Sweets"],
    short_description: "Candy, cupcakes, and drinks for kids parties",
  })
  const cats = getMatchingCuisineCategories(dessert)
  assert.ok(cats.includes("desserts"))
  assert.equal(cats.includes("coffee"), false)
})

test("Structured cuisine labels override loose text", () => {
  const pizza = truck({
    name: "Pizza First",
    cuisine_types: ["Pizza"],
    full_description: "We also pour lemonade, boba tea, and espresso all day",
    tagline: "Coffee and dessert specials",
  })
  const cats = getMatchingCuisineCategories(pizza)
  assert.deepEqual(cats, ["italian"])
})

test("Empty structured fields can still use short description fallback", () => {
  const caribbean = truck({
    name: "Island Lane",
    short_description: "Authentic jerk chicken and Caribbean sides",
  })
  assert.ok(getMatchingCuisineCategories(caribbean).includes("caribbean"))
})

test("Jamaican / Caribbean maps from cuisine_types and free-text cuisine", () => {
  const fromType = truck({ name: "Island Eats", cuisine_types: ["Caribbean"] })
  assert.ok(getMatchingCuisineCategories(fromType).includes("caribbean"))

  const fromText = truck({ name: "Jerk Spot", cuisine: "Jamaican" })
  assert.ok(getMatchingCuisineCategories(fromText).includes("caribbean"))
})

test("Indian maps from Indian / Curry label and cuisine field", () => {
  const fromType = truck({ name: "Spice Route", cuisine_types: ["Indian / Curry"] })
  assert.ok(getMatchingCuisineCategories(fromType).includes("indian"))

  const fromText = truck({ name: "Naan House", cuisine: "Indian, Tikka Masala" })
  assert.ok(getMatchingCuisineCategories(fromText).includes("indian"))
})

test("Juice / Smoothies structured label maps to Coffee / Drinks and Healthy", () => {
  const juice = truck({ name: "Fresh Press", cuisine_types: ["Juice / Smoothies"] })
  const cats = getMatchingCuisineCategories(juice)
  assert.ok(cats.includes("coffee"))
  assert.ok(cats.includes("healthy"))
})

test("Dessert and snow cone structured labels map correctly", () => {
  const sweets = truck({ name: "Sweet Route", cuisine_types: ["Desserts / Sweets"] })
  assert.ok(getMatchingCuisineCategories(sweets).includes("desserts"))

  const snow = truck({ name: "Ice Dream", cuisine_types: ["Snow Cones / Slushies"] })
  assert.ok(getMatchingCuisineCategories(snow).includes("desserts"))
  assert.equal(getMatchingCuisineCategories(snow).includes("coffee"), false)
})

test("Latin American maps Cuban, Puerto Rican, Colombian from strong fields", () => {
  const colombian = truck({ name: "Arepa Cart", cuisine_types: ["Latin / Colombian"] })
  assert.ok(getMatchingCuisineCategories(colombian).includes("latin"))

  const cuban = truck({ name: "Havana Bites", cuisine: "Cuban sandwiches" })
  assert.ok(getMatchingCuisineCategories(cuban).includes("latin"))
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
})

test("Multiple cuisines match when supported by strong structured data", () => {
  const multi = truck({
    name: "Fusion Truck",
    cuisine: "Bowls",
    cuisine_types: ["Mexican / Tacos", "Vegetarian / Vegan"],
  })
  const cats = getMatchingCuisineCategories(multi)
  assert.ok(cats.includes("tacos"))
  assert.ok(cats.includes("vegan_veg"))
  assert.ok(cats.includes("healthy"))
  assert.equal(matchesCuisineCategory(multi, "other"), false)
})

test("Coffee truck with pastry/dessert labels can match both Coffee and Desserts", () => {
  const both = truck({
    name: "Brew & Bake",
    cuisine: "Coffee",
    cuisine_types: ["Desserts / Sweets"],
  })
  const cats = getMatchingCuisineCategories(both)
  assert.ok(cats.includes("coffee"))
  assert.ok(cats.includes("desserts"))
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
})

test("Default browse (no cuisine filter) does not hide trucks", () => {
  const any = truck({ name: "Any Truck", cuisine: null, cuisine_types: [] })
  assert.equal(matchesCuisineCategory(any, null), true)
  assert.equal(matchesCuisineCategory(any, ""), true)
})
