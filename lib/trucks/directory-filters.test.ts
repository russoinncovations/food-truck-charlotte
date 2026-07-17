import assert from "node:assert/strict"
import test from "node:test"
import {
  CUISINE_FILTER_OPTIONS,
  getMatchingCuisineCategories,
  matchesCuisineCategory,
  resolveCuisineFilterParam,
  type DirectoryFilterTruck,
} from "./directory-filters"

function truck(partial: Partial<DirectoryFilterTruck> & { name: string }): DirectoryFilterTruck {
  return {
    cuisine: null,
    cuisine_types: null,
    ...partial,
  }
}

test("cuisine filter options match the simplified host-facing list", () => {
  assert.deepEqual(
    CUISINE_FILTER_OPTIONS.map((o) => o.label),
    [
      "American / Comfort",
      "BBQ",
      "Mexican / Latin",
      "Caribbean / Jamaican",
      "Asian / Indian",
      "Mediterranean / Middle Eastern",
      "Pizza / Italian",
      "Southern / Soul Food",
      "Seafood",
      "Breakfast / Brunch",
      "Coffee / Drinks",
      "Desserts / Sweets",
      "Vegan / Vegetarian / Healthy",
      "Other",
    ]
  )
})

test("Italian ice maps to Desserts / Sweets and not Pizza / Italian", () => {
  const italianIce = truck({ name: "Ice Cart", cuisine: "Italian ice" })
  const cats = getMatchingCuisineCategories(italianIce)
  assert.ok(cats.includes("desserts"))
  assert.equal(cats.includes("italian"), false)
})

test("Donuts map to Desserts and Breakfast, not Coffee / Drinks", () => {
  const donuts = truck({ name: "Holey", cuisine: "Donuts" })
  const cats = getMatchingCuisineCategories(donuts)
  assert.ok(cats.includes("desserts"))
  assert.ok(cats.includes("breakfast"))
  assert.equal(cats.includes("coffee"), false)
})

test("Churros map to Desserts and Mexican / Latin, not Coffee / Drinks", () => {
  const churros = truck({ name: "Churro Co", cuisine: "Churros" })
  const cats = getMatchingCuisineCategories(churros)
  assert.ok(cats.includes("desserts"))
  assert.ok(cats.includes("mexican_latin"))
  assert.equal(cats.includes("coffee"), false)
})

test("Pizza / pasta maps to Pizza / Italian", () => {
  const pizza = truck({ name: "Slice", cuisine_types: ["Pizza"] })
  assert.ok(getMatchingCuisineCategories(pizza).includes("italian"))

  const pasta = truck({ name: "Pasta Night", cuisine: "Pasta" })
  assert.ok(getMatchingCuisineCategories(pasta).includes("italian"))
})

test("Coffee/espresso maps to Coffee / Drinks and Breakfast / Brunch", () => {
  const coffee = truck({ name: "Morning Bell", cuisine: "Coffee" })
  const coffeeCats = getMatchingCuisineCategories(coffee)
  assert.ok(coffeeCats.includes("coffee"))
  assert.ok(coffeeCats.includes("breakfast"))
})

test("Lemonade/boba/tea maps to Coffee / Drinks", () => {
  const lemonade = truck({
    name: "Sip Co",
    today_specials: "Fresh lemonade and iced tea",
  })
  assert.ok(getMatchingCuisineCategories(lemonade).includes("coffee"))
})

test("Crepes map to Breakfast / Brunch and Desserts / Sweets", () => {
  const crepes = truck({ name: "Crepe Cart", cuisine_types: ["Crepes / Waffles"] })
  const cats = getMatchingCuisineCategories(crepes)
  assert.ok(cats.includes("breakfast"))
  assert.ok(cats.includes("desserts"))
})

test("Ice cream / shaved ice / slushies map to Desserts only", () => {
  assert.deepEqual(getMatchingCuisineCategories(truck({ name: "Cone Co", cuisine: "Ice cream" })), [
    "desserts",
  ])
  assert.deepEqual(getMatchingCuisineCategories(truck({ name: "Shave It", cuisine: "Shaved ice" })), [
    "desserts",
  ])
})

test("Structured Pizza overrides loose coffee/dessert copy", () => {
  const pizza = truck({
    name: "Pizza First",
    cuisine_types: ["Pizza"],
    full_description: "We also pour lemonade, boba tea, and espresso all day",
    tagline: "Coffee and dessert specials",
  })
  assert.deepEqual(getMatchingCuisineCategories(pizza), ["italian"])
})

test("Dessert truck mentioning drinks once does not match Coffee / Drinks", () => {
  const dessert = truck({
    name: "Sweet Route",
    cuisine_types: ["Desserts / Sweets"],
    short_description: "Candy, cupcakes, and drinks for kids parties",
  })
  const cats = getMatchingCuisineCategories(dessert)
  assert.ok(cats.includes("desserts"))
  assert.equal(cats.includes("coffee"), false)
})

test("Empty structured fields can still use short description fallback", () => {
  const caribbean = truck({
    name: "Island Lane",
    short_description: "Authentic jerk chicken and Caribbean sides",
  })
  assert.ok(getMatchingCuisineCategories(caribbean).includes("caribbean"))
})

test("Caribbean / Jamaican and Asian / Indian structured labels", () => {
  assert.ok(
    getMatchingCuisineCategories(
      truck({ name: "Island Eats", cuisine_types: ["Caribbean"] })
    ).includes("caribbean")
  )
  assert.ok(
    getMatchingCuisineCategories(
      truck({ name: "Spice Route", cuisine_types: ["Indian / Curry"] })
    ).includes("asian_indian")
  )
  assert.ok(
    getMatchingCuisineCategories(
      truck({ name: "Thai Bowl", cuisine_types: ["Asian Fusion"] })
    ).includes("asian_indian")
  )
})

test("Juice / Smoothies maps to Coffee / Drinks and Vegan / Vegetarian / Healthy", () => {
  const juice = truck({ name: "Fresh Press", cuisine_types: ["Juice / Smoothies"] })
  const cats = getMatchingCuisineCategories(juice)
  assert.ok(cats.includes("coffee"))
  assert.ok(cats.includes("vegan_healthy"))
})

test("Mexican / Latin covers tacos, Colombian, Cuban, churros", () => {
  assert.ok(
    getMatchingCuisineCategories(
      truck({ name: "Taco Truck", cuisine_types: ["Mexican / Tacos"] })
    ).includes("mexican_latin")
  )
  assert.ok(
    getMatchingCuisineCategories(
      truck({ name: "Arepa Cart", cuisine_types: ["Latin / Colombian"] })
    ).includes("mexican_latin")
  )
  assert.ok(
    getMatchingCuisineCategories(truck({ name: "Havana", cuisine: "Cuban sandwiches" })).includes(
      "mexican_latin"
    )
  )
})

test("Burgers / wings / sandwiches / hot dogs map to American / Comfort", () => {
  assert.ok(
    getMatchingCuisineCategories(
      truck({ name: "Smash Co", cuisine_types: ["American / Burgers"] })
    ).includes("american")
  )
  assert.ok(
    getMatchingCuisineCategories(
      truck({ name: "Wrap It", cuisine_types: ["Sandwiches / Wraps"] })
    ).includes("american")
  )
  assert.ok(
    getMatchingCuisineCategories(
      truck({ name: "Wing Lab", cuisine_types: ["Wings / Chicken"] })
    ).includes("american")
  )
  assert.ok(
    getMatchingCuisineCategories(truck({ name: "Dog House", cuisine: "Hot dogs" })).includes(
      "american"
    )
  )
})

test("Multiple broad filters when strong structured data supports it", () => {
  const multi = truck({
    name: "Fusion Truck",
    cuisine: "Bowls",
    cuisine_types: ["Mexican / Tacos", "Vegetarian / Vegan"],
  })
  const cats = getMatchingCuisineCategories(multi)
  assert.ok(cats.includes("mexican_latin"))
  assert.ok(cats.includes("vegan_healthy"))
  assert.equal(matchesCuisineCategory(multi, "other"), false)
})

test("Coffee + dessert labels can match Coffee, Breakfast, and Desserts", () => {
  const both = truck({
    name: "Brew & Bake",
    cuisine: "Coffee",
    cuisine_types: ["Desserts / Sweets"],
  })
  const cats = getMatchingCuisineCategories(both)
  assert.ok(cats.includes("coffee"))
  assert.ok(cats.includes("breakfast"))
  assert.ok(cats.includes("desserts"))
})

test("BBQ and Southern / Soul Food labels map correctly", () => {
  assert.ok(
    getMatchingCuisineCategories(
      truck({ name: "Smoke Ring", cuisine_types: ["BBQ / Smokehouse"] })
    ).includes("bbq")
  )
  assert.ok(
    getMatchingCuisineCategories(
      truck({ name: "Soul Kitchen", cuisine_types: ["Southern / Soul Food"] })
    ).includes("soul")
  )
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

test("resolveCuisineFilterParam accepts current and legacy URL values", () => {
  assert.equal(resolveCuisineFilterParam("mexican_latin"), "mexican_latin")
  assert.equal(resolveCuisineFilterParam("tacos"), "mexican_latin")
  assert.equal(resolveCuisineFilterParam("indian"), "asian_indian")
  assert.equal(resolveCuisineFilterParam("vegan_veg"), "vegan_healthy")
  assert.equal(resolveCuisineFilterParam("burgers"), "american")
  assert.equal(resolveCuisineFilterParam("nope"), "")
})
