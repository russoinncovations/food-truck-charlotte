import { createClient, type SupabaseClient } from "@supabase/supabase-js"

export type AdminSupabaseClientInitBlocker =
  | "none"
  | "missing_supabase_url"
  | "missing_service_role_key"

/** Runtime env presence for admin diagnostics (never exposes secret values). */
export type AdminSupabaseEnvDiagnostics = {
  supabaseUrlPresent: boolean
  serviceRoleKeyPresent: boolean
  adminClientCreated: boolean
  clientInitBlocker: AdminSupabaseClientInitBlocker
}

function readSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ""
}

function readServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? ""
}

export function getAdminSupabaseEnvDiagnostics(): AdminSupabaseEnvDiagnostics {
  const url = readSupabaseUrl()
  const key = readServiceRoleKey()

  let clientInitBlocker: AdminSupabaseClientInitBlocker = "none"
  if (!url) clientInitBlocker = "missing_supabase_url"
  else if (!key) clientInitBlocker = "missing_service_role_key"

  return {
    supabaseUrlPresent: Boolean(url),
    serviceRoleKeyPresent: Boolean(key),
    adminClientCreated: Boolean(url && key),
    clientInitBlocker,
  }
}

/**
 * Service-role client for trusted server-only operations (e.g. admin after ADMIN_KEY check).
 * Bypasses RLS. Do not import from client components.
 */
export function createAdminSupabaseClient(): SupabaseClient | null {
  const url = readSupabaseUrl()
  const key = readServiceRoleKey()
  if (!url || !key) {
    return null
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function describeAdminClientInitFailure(diag: AdminSupabaseEnvDiagnostics): string {
  switch (diag.clientInitBlocker) {
    case "missing_supabase_url":
      return "createAdminSupabaseClient returned null: NEXT_PUBLIC_SUPABASE_URL is missing or empty in this runtime."
    case "missing_service_role_key":
      return "createAdminSupabaseClient returned null: SUPABASE_SERVICE_ROLE_KEY is missing or empty in this runtime."
    default:
      return "createAdminSupabaseClient returned null for an unknown reason."
  }
}
