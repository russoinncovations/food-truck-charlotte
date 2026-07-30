import assert from "node:assert/strict"
import test from "node:test"
import {
  isDessertOnlyVendor,
  mergeVendorNeedIntoNotes,
  parseVendorNeedValue,
  VENDOR_NEED,
  vendorNeedLabel,
} from "@/lib/booking/vendor-need"

test("parseVendorNeedValue accepts known values", () => {
  assert.equal(parseVendorNeedValue("dessert"), VENDOR_NEED.DESSERT)
  assert.equal(parseVendorNeedValue("nope"), null)
})

test("mergeVendorNeedIntoNotes appends labeled line", () => {
  assert.equal(
    mergeVendorNeedIntoNotes(null, VENDOR_NEED.DESSERT),
    `Vendor need: ${vendorNeedLabel(VENDOR_NEED.DESSERT)}`
  )
  assert.equal(
    mergeVendorNeedIntoNotes("Hello", VENDOR_NEED.MEAL),
    `Hello\n\nVendor need: ${vendorNeedLabel(VENDOR_NEED.MEAL)}`
  )
})

test("isDessertOnlyVendor detects ice cream shop without meal cuisines", () => {
  assert.equal(
    isDessertOnlyVendor({
      name: "Dairy Barn Ice Cream Shoppe",
      cuisine: "Desserts / Sweets",
      cuisine_types: ["Desserts / Sweets"],
      vendor_type: "truck",
    }),
    true
  )
  assert.equal(
    isDessertOnlyVendor({
      name: "Taco + Churro Combo",
      cuisine: "Mexican / Tacos",
      cuisine_types: ["Mexican / Tacos", "Desserts / Sweets"],
      vendor_type: "truck",
    }),
    false
  )
})
