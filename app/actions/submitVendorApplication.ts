"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export type VendorApplicationResult = {
  success: boolean
  error?: string
}

export async function submitVendorApplication(
  _prevState: VendorApplicationResult | null,
  formData: FormData
): Promise<VendorApplicationResult> {
  const supabase = await createClient()

  // Extract form data
  const vendorType = formData.get("vendorType") as string
  const truckName = formData.get("truckName") as string
  const ownerName = formData.get("ownerName") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const website = formData.get("website") as string
  const instagram = formData.get("instagram") as string
  const cuisineType = formData.get("cuisineType") as string
  const description = formData.get("description") as string
  const yearsInBusiness = formData.get("yearsInBusiness") as string

  // Get cuisine array from checkboxes
  const cuisines = formData.getAll("cuisines") as string[]

  // Log what we're about to insert
  console.log("[v0] Attempting vendor application insert:", {
    vendor_type: vendorType,
    truck_name: truckName,
    owner_name: ownerName,
    email,
    cuisines,
  })

  // Validate required fields
  if (!vendorType || !truckName || !ownerName || !email) {
    console.log("[v0] Validation failed - missing required fields")
    return {
      success: false,
      error: "Please fill in all required fields (vendor type, truck name, owner name, email).",
    }
  }

  // Insert into database
  const insertData = {
    vendor_type: vendorType,
    truck_name: truckName,
    owner_name: ownerName,
    email,
    phone: phone || null,
    website: website || null,
    instagram: instagram || null,
    cuisine_type: cuisineType || null,
    cuisines: cuisines.length > 0 ? cuisines : null,
    description: description || null,
    years_in_business: yearsInBusiness ? parseInt(yearsInBusiness) : null,
    status: "pending",
  }

  console.log("[v0] Insert data:", JSON.stringify(insertData, null, 2))

  const { data, error } = await supabase
    .from("vendor_applications")
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error("[v0] Supabase insert error:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    return {
      success: false,
      error: `Database error: ${error.message}. Code: ${error.code}`,
    }
  }

  console.log("[v0] Insert successful, row id:", data?.id)

  // Only redirect on confirmed success
  redirect("/list-your-truck/success")
}
