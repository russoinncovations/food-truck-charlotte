"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export type OpportunityActionResult = {
  success: boolean
  error?: string
}

export async function updateTruckOpportunityStatus(
  formData: FormData
): Promise<OpportunityActionResult> {
  const opportunityId = formData.get("opportunityId") as string | null
  const status = formData.get("status") as string | null
  if (!opportunityId || (status !== "interested" && status !== "pass")) {
    return { success: false, error: "Invalid request" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) {
    return { success: false, error: "Unauthorized" }
  }

  const { data: truck } = await supabase
    .from("trucks")
    .select("id")
    .eq("email", user.email)
    .maybeSingle()

  if (!truck?.id) {
    return { success: false, error: "No truck profile" }
  }

  const { data: updated, error: updateError } = await supabase
    .from("truck_opportunities")
    .update({ status })
    .eq("id", opportunityId)
    .eq("truck_id", truck.id)
    .select("id")
    .maybeSingle()

  if (updateError) {
    return { success: false, error: updateError.message }
  }
  if (!updated) {
    return { success: false, error: "Opportunity not found or already updated" }
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/events")
  return { success: true }
}
