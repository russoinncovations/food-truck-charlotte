import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { isValidTruckMapCoordinates } from "@/lib/location/truck-map-coords"
import { PUBLIC_LISTED_TRUCK_EQ } from "@/lib/trucks/public-listed-truck-query"
import { isInternalDemoVendorTruck } from "@/lib/trucks/internal-demo-vendor"
import { isPlausibleVendorEmail } from "@/lib/trucks/vendor-reminder-recipients"
import { VENDOR_EMAIL_GO_LIVE_DASHBOARD_URL } from "@/lib/email/vendor-email-public-links"

export type VendorStatusIssueFlag =
  | "application_not_approved"
  | "missing_vendor_email"
  | "duplicate_email"
  | "duplicate_truck_name"
  | "no_slug"
  | "hidden_from_directory"
  | "missing_location"
  | "not_connected_to_vendor_account"
  | "not_map_eligible"
  | "no_recent_activity"
  | "missing_photo"
  | "live_no_valid_coords"
  | "listed_inactive"
  | "blocked_by_rls"
  | "historical_application_record"

export type VendorAuditRowType =
  | "active_truck"
  | "truck_profile"
  | "application_only"
  | "historical_application"

export type VendorAuditIssueSeverity = "critical" | "action" | "info"

export type VendorStatusAuditIssue = {
  flag: VendorStatusIssueFlag
  severity: VendorAuditIssueSeverity
}

export type VendorStatusAuditRow = {
  rowType: VendorAuditRowType
  truckId: string | null
  truckName: string
  slug: string | null
  vendorEmail: string | null
  applicationId: string | null
  applicationStatus: string | null
  authUserId: string | null
  showInDirectory: boolean | null
  isActive: boolean | null
  listingStatus: string | null
  legacyActive: boolean | null
  hasPhoto: boolean
  hasLocationFields: boolean
  hasCurrentLiveLocation: boolean
  servingToday: boolean
  visibleOnDirectory: boolean
  eligibleForLiveMap: boolean
  onMapPinNow: boolean
  canAccessGoLiveDashboard: boolean
  lastUpdated: string | null
  issues: VendorStatusAuditIssue[]
  profileUrl: string | null
  adminVendorsUrl: string
  goLiveUrl: string | null
}

export type VendorAuditGroupClassification = "production" | "internal_test"

export type VendorStatusAuditGroup = {
  groupKey: string
  displayName: string
  groupClassification: VendorAuditGroupClassification
  primary: VendorStatusAuditRow
  linkedApplications: VendorStatusAuditRow[]
  highestSeverity: "ready" | VendorAuditIssueSeverity
  criticalCount: number
  actionCount: number
  infoCount: number
  isReadyTruck: boolean
}

export type VendorStatusAuditSummary = {
  usedServiceRole: boolean
  totalGroups: number
  readyTruckProfiles: number
  criticalBlockers: number
  needsCleanup: number
  internalTestRecords: number
  applicationOnlyRecords: number
  historicalApplicationRecords: number
  /** @deprecated use totalGroups */
  totalRows: number
  truckRows: number
  applicationOnlyRows: number
  withIssues: number
  notMapEligible: number
  notConnected: number
  hiddenOrUnlisted: number
}

type TruckRow = {
  id: string
  name: string | null
  slug: string | null
  email: string | null
  show_in_directory: boolean | null
  is_active: boolean | null
  status: string | null
  active: boolean | null
  photo_url: string | null
  hero_photo_url: string | null
  serving_today: boolean | null
  latitude: number | null
  longitude: number | null
  today_location: string | null
  street_address: string | null
  source_application_id: string | null
  updated_at: string | null
  created_at: string | null
}

type ApplicationRow = {
  id: string
  business_name: string | null
  email: string | null
  status: string | null
  approved_truck_id: string | null
  updated_at: string | null
  created_at: string | null
}

const RECENT_ACTIVITY_MS = 60 * 24 * 60 * 60 * 1000

const FLAG_SEVERITY: Record<VendorStatusIssueFlag, VendorAuditIssueSeverity> = {
  missing_vendor_email: "critical",
  not_connected_to_vendor_account: "action",
  hidden_from_directory: "critical",
  not_map_eligible: "critical",
  live_no_valid_coords: "critical",
  blocked_by_rls: "critical",
  no_slug: "action",
  missing_location: "action",
  missing_photo: "action",
  application_not_approved: "action",
  listed_inactive: "action",
  duplicate_email: "info",
  duplicate_truck_name: "info",
  no_recent_activity: "info",
  historical_application_record: "info",
}

export const ISSUE_LABELS: Record<VendorStatusIssueFlag, string> = {
  application_not_approved: "Application not approved",
  missing_vendor_email: "Missing vendor email",
  duplicate_email: "Duplicate email (cross-vendor)",
  duplicate_truck_name: "Duplicate name (cross-vendor)",
  no_slug: "No slug",
  hidden_from_directory: "Hidden / unlisted",
  missing_location: "Needs first live location",
  not_connected_to_vendor_account: "Vendor has not logged in yet",
  not_map_eligible: "Not map eligible",
  no_recent_activity: "No recent activity (60d+)",
  missing_photo: "Missing photo",
  live_no_valid_coords: "Live but missing valid coordinates",
  listed_inactive: "Listed flag but inactive status",
  blocked_by_rls: "Blocked by legacy active flag",
  historical_application_record: "Historical application on file",
}

function trimStr(v: unknown): string {
  return typeof v === "string" ? v.trim() : ""
}

export function normalizeAuditName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Obvious internal/demo/test naming — word boundaries avoid false positives like “Contesto”. */
export function hasObviousInternalTestName(name: string | null | undefined): boolean {
  return /\b(demo|test|testing)\b/i.test(String(name ?? "").trim())
}

function isKnownInternalTestEmail(email: string | null | undefined): boolean {
  const key = trimStr(email).toLowerCase()
  if (!key) return false
  return isInternalDemoVendorTruck({ email: key })
}

export function classifyVendorAuditGroup(primary: VendorStatusAuditRow): VendorAuditGroupClassification {
  if (isInternalDemoVendorTruck({ name: primary.truckName, email: primary.vendorEmail })) {
    return "internal_test"
  }
  if (hasObviousInternalTestName(primary.truckName)) return "internal_test"
  if (isKnownInternalTestEmail(primary.vendorEmail)) return "internal_test"

  if (primary.rowType === "application_only") {
    const status = trimStr(primary.applicationStatus)
    if (status === "rejected") {
      if (hasObviousInternalTestName(primary.truckName)) return "internal_test"
      if (isKnownInternalTestEmail(primary.vendorEmail)) return "internal_test"
    }
  }

  return "production"
}

function isProductionGroup(group: VendorStatusAuditGroup): boolean {
  return group.groupClassification === "production"
}

type IssueContext = {
  servingToday: boolean
  hasPlausibleEmail: boolean
  rowType: VendorAuditRowType
}

function resolveIssueSeverity(flag: VendorStatusIssueFlag, ctx: IssueContext): VendorAuditIssueSeverity {
  if (flag === "not_connected_to_vendor_account") {
    if (ctx.hasPlausibleEmail && ctx.rowType !== "application_only") return "action"
    return FLAG_SEVERITY[flag]
  }

  if (flag === "missing_location") {
    if (ctx.rowType === "application_only") return "critical"
    if (!ctx.servingToday) return "info"
    return "critical"
  }

  return FLAG_SEVERITY[flag]
}

function issue(flag: VendorStatusIssueFlag, ctx: IssueContext): VendorStatusAuditIssue {
  return { flag, severity: resolveIssueSeverity(flag, ctx) }
}

function isPublicListed(truck: TruckRow): boolean {
  return (
    truck.show_in_directory === PUBLIC_LISTED_TRUCK_EQ.show_in_directory &&
    truck.is_active === PUBLIC_LISTED_TRUCK_EQ.is_active &&
    truck.status === PUBLIC_LISTED_TRUCK_EQ.status
  )
}

function isRlsPublicVisible(truck: TruckRow): boolean {
  return isPublicListed(truck) && truck.active !== false
}

function hasPhoto(truck: TruckRow): boolean {
  return Boolean(trimStr(truck.photo_url) || trimStr(truck.hero_photo_url))
}

function hasLocationFields(truck: TruckRow): boolean {
  return Boolean(trimStr(truck.today_location) || trimStr(truck.street_address))
}

function hasLiveCoords(truck: TruckRow): boolean {
  return isValidTruckMapCoordinates(truck.latitude, truck.longitude)
}

function onMapPinNow(truck: TruckRow): boolean {
  return isRlsPublicVisible(truck) && truck.serving_today === true && hasLiveCoords(truck)
}

function truckRowType(truck: TruckRow, visible: boolean): VendorAuditRowType {
  if (visible && truck.serving_today === true) return "active_truck"
  return "truck_profile"
}

async function fetchAuthEmailIndex(
  admin: NonNullable<ReturnType<typeof createAdminSupabaseClient>>
): Promise<Map<string, string>> {
  const byEmail = new Map<string, string>()
  let page = 1
  const perPage = 1000

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) {
      console.warn("[vendor-status-audit] auth listUsers:", error.message)
      break
    }
    const users = data?.users ?? []
    for (const u of users) {
      const email = trimStr(u.email).toLowerCase()
      if (email && u.id) byEmail.set(email, u.id)
    }
    if (users.length < perPage) break
    page += 1
    if (page > 20) break
  }

  return byEmail
}

/** Duplicates among truck rows only (cross-vendor), not application history. */
function truckDuplicateKeys(trucks: TruckRow[]): {
  duplicateEmails: Set<string>
  duplicateNames: Set<string>
} {
  const emailCounts = new Map<string, number>()
  const nameCounts = new Map<string, number>()
  for (const t of trucks) {
    const e = trimStr(t.email).toLowerCase()
    const n = normalizeAuditName(trimStr(t.name))
    if (e) emailCounts.set(e, (emailCounts.get(e) ?? 0) + 1)
    if (n) nameCounts.set(n, (nameCounts.get(n) ?? 0) + 1)
  }
  const duplicateEmails = new Set<string>()
  const duplicateNames = new Set<string>()
  for (const [k, n] of emailCounts) if (n > 1) duplicateEmails.add(k)
  for (const [k, n] of nameCounts) if (n > 1) duplicateNames.add(k)
  return { duplicateEmails, duplicateNames }
}

function computeTruckIssues(opts: {
  truck: TruckRow
  primaryApplicationStatus: string | null
  duplicateEmails: Set<string>
  duplicateNames: Set<string>
  authByEmail: Map<string, string>
}): VendorStatusAuditIssue[] {
  const { truck, primaryApplicationStatus, duplicateEmails, duplicateNames, authByEmail } = opts
  const flags: VendorStatusIssueFlag[] = []
  const email = trimStr(truck.email)
  const emailKey = email.toLowerCase()
  const nameKey = normalizeAuditName(trimStr(truck.name))
  const listed = isPublicListed(truck)
  const visible = isRlsPublicVisible(truck)

  if (primaryApplicationStatus && primaryApplicationStatus !== "approved") {
    flags.push("application_not_approved")
  }

  if (!isPlausibleVendorEmail(email)) flags.push("missing_vendor_email")
  if (emailKey && duplicateEmails.has(emailKey)) flags.push("duplicate_email")
  if (nameKey && duplicateNames.has(nameKey)) flags.push("duplicate_truck_name")
  if (!trimStr(truck.slug)) flags.push("no_slug")

  if (!visible) flags.push("hidden_from_directory")
  if (truck.show_in_directory === true && !listed) flags.push("listed_inactive")
  if (truck.show_in_directory === true && truck.active === false) flags.push("blocked_by_rls")

  const servingToday = truck.serving_today === true

  if (servingToday && !hasLiveCoords(truck)) {
    flags.push("live_no_valid_coords")
  } else if (!servingToday && !hasLocationFields(truck) && !hasLiveCoords(truck)) {
    flags.push("missing_location")
  }

  if (isPlausibleVendorEmail(email) && authByEmail.size > 0 && !authByEmail.has(emailKey)) {
    flags.push("not_connected_to_vendor_account")
  }

  if (!visible) {
    flags.push("not_map_eligible")
  }

  if (visible && !hasPhoto(truck)) flags.push("missing_photo")

  const last = truck.updated_at ?? truck.created_at
  if (
    visible &&
    !servingToday &&
    last &&
    Date.now() - new Date(last).getTime() > RECENT_ACTIVITY_MS
  ) {
    flags.push("no_recent_activity")
  }

  const ctx: IssueContext = {
    servingToday,
    hasPlausibleEmail: isPlausibleVendorEmail(email),
    rowType: "truck_profile",
  }

  return flags.map((flag) => issue(flag, ctx))
}

function computeStandaloneApplicationIssues(opts: {
  app: ApplicationRow
  duplicateEmails: Set<string>
  duplicateNames: Set<string>
  authByEmail: Map<string, string>
}): VendorStatusAuditIssue[] {
  const { app, duplicateEmails, duplicateNames, authByEmail } = opts
  const flags: VendorStatusIssueFlag[] = []
  const email = trimStr(app.email)
  const emailKey = email.toLowerCase()
  const nameKey = normalizeAuditName(trimStr(app.business_name))
  const status = trimStr(app.status) || "unknown"

  if (status !== "approved") flags.push("application_not_approved")
  if (!isPlausibleVendorEmail(email)) flags.push("missing_vendor_email")

  if (emailKey && duplicateEmails.has(emailKey)) flags.push("duplicate_email")
  if (nameKey && duplicateNames.has(nameKey)) flags.push("duplicate_truck_name")

  flags.push("hidden_from_directory", "not_map_eligible", "missing_location")

  if (isPlausibleVendorEmail(email) && authByEmail.size > 0 && !authByEmail.has(emailKey)) {
    flags.push("not_connected_to_vendor_account")
  }

  const ctx: IssueContext = {
    servingToday: false,
    hasPlausibleEmail: isPlausibleVendorEmail(email),
    rowType: "application_only",
  }

  return [...new Set(flags)].map((flag) => issue(flag, ctx))
}

function computeHistoricalApplicationIssues(app: ApplicationRow): VendorStatusAuditIssue[] {
  const flags: VendorStatusIssueFlag[] = ["historical_application_record"]
  const status = trimStr(app.status) || "unknown"
  if (status !== "approved" && status !== "rejected") {
    flags.push("application_not_approved")
  }
  const ctx: IssueContext = {
    servingToday: false,
    hasPlausibleEmail: isPlausibleVendorEmail(trimStr(app.email)),
    rowType: "historical_application",
  }

  return flags.map((flag) => issue(flag, ctx))
}

function buildTruckRow(
  truck: TruckRow,
  opts: {
    primaryApplicationStatus: string | null
    applicationId: string | null
    duplicateEmails: Set<string>
    duplicateNames: Set<string>
    authByEmail: Map<string, string>
    adminVendorsUrl: string
  }
): VendorStatusAuditRow {
  const email = trimStr(truck.email) || null
  const emailKey = email?.toLowerCase() ?? ""
  const slug = trimStr(truck.slug) || null
  const visible = isRlsPublicVisible(truck)

  return {
    rowType: truckRowType(truck, visible),
    truckId: truck.id,
    truckName: trimStr(truck.name) || "Unnamed truck",
    slug,
    vendorEmail: email,
    applicationId: opts.applicationId,
    applicationStatus: opts.primaryApplicationStatus,
    authUserId: emailKey ? opts.authByEmail.get(emailKey) ?? null : null,
    showInDirectory: truck.show_in_directory,
    isActive: truck.is_active,
    listingStatus: truck.status,
    legacyActive: truck.active,
    hasPhoto: hasPhoto(truck),
    hasLocationFields: hasLocationFields(truck),
    hasCurrentLiveLocation: hasLiveCoords(truck),
    servingToday: truck.serving_today === true,
    visibleOnDirectory: visible,
    eligibleForLiveMap: visible,
    onMapPinNow: onMapPinNow(truck),
    canAccessGoLiveDashboard: isPlausibleVendorEmail(email),
    lastUpdated: truck.updated_at ?? truck.created_at,
    issues: computeTruckIssues({
      truck,
      primaryApplicationStatus: opts.primaryApplicationStatus,
      duplicateEmails: opts.duplicateEmails,
      duplicateNames: opts.duplicateNames,
      authByEmail: opts.authByEmail,
    }),
    profileUrl: slug ? `/trucks/${slug}` : null,
    adminVendorsUrl: opts.adminVendorsUrl,
    goLiveUrl: isPlausibleVendorEmail(email) ? VENDOR_EMAIL_GO_LIVE_DASHBOARD_URL : null,
  }
}

function buildApplicationRow(
  app: ApplicationRow,
  rowType: VendorAuditRowType,
  issues: VendorStatusAuditIssue[],
  adminVendorsUrl: string,
  authByEmail: Map<string, string>
): VendorStatusAuditRow {
  const email = trimStr(app.email) || null
  const emailKey = email?.toLowerCase() ?? ""

  return {
    rowType,
    truckId: app.approved_truck_id,
    truckName: trimStr(app.business_name) || "Application (no truck row)",
    slug: null,
    vendorEmail: email,
    applicationId: app.id,
    applicationStatus: app.status,
    authUserId: emailKey ? authByEmail.get(emailKey) ?? null : null,
    showInDirectory: null,
    isActive: null,
    listingStatus: null,
    legacyActive: null,
    hasPhoto: false,
    hasLocationFields: false,
    hasCurrentLiveLocation: false,
    servingToday: false,
    visibleOnDirectory: false,
    eligibleForLiveMap: false,
    onMapPinNow: false,
    canAccessGoLiveDashboard: isPlausibleVendorEmail(email),
    lastUpdated: app.updated_at ?? app.created_at,
    issues,
    profileUrl: null,
    adminVendorsUrl,
    goLiveUrl: isPlausibleVendorEmail(email) ? VENDOR_EMAIL_GO_LIVE_DASHBOARD_URL : null,
  }
}

function countSeverities(rows: VendorStatusAuditRow[]): {
  critical: number
  action: number
  info: number
  highest: VendorStatusAuditGroup["highestSeverity"]
} {
  let critical = 0
  let action = 0
  let info = 0
  for (const row of rows) {
    for (const i of row.issues) {
      if (i.severity === "critical") critical += 1
      else if (i.severity === "action") action += 1
      else info += 1
    }
  }
  let highest: VendorStatusAuditGroup["highestSeverity"] = "ready"
  if (critical > 0) highest = "critical"
  else if (action > 0) highest = "action"
  else if (info > 0) highest = "info"
  return { critical, action, info, highest }
}

function appMatchesTruck(app: ApplicationRow, truck: TruckRow): boolean {
  const appEmail = trimStr(app.email).toLowerCase()
  const truckEmail = trimStr(truck.email).toLowerCase()
  if (appEmail && truckEmail && appEmail === truckEmail) return true

  const appName = normalizeAuditName(trimStr(app.business_name))
  const truckName = normalizeAuditName(trimStr(truck.name))
  if (appName && truckName && appName === truckName) return true

  if (truck.source_application_id && truck.source_application_id === app.id) return true

  return false
}

export async function fetchVendorStatusAudit(adminVendorsUrl: string): Promise<{
  groups: VendorStatusAuditGroup[]
  summary: VendorStatusAuditSummary
}> {
  const admin = createAdminSupabaseClient()
  const emptySummary: VendorStatusAuditSummary = {
    usedServiceRole: false,
    totalGroups: 0,
    readyTruckProfiles: 0,
    criticalBlockers: 0,
    needsCleanup: 0,
    internalTestRecords: 0,
    applicationOnlyRecords: 0,
    historicalApplicationRecords: 0,
    totalRows: 0,
    truckRows: 0,
    applicationOnlyRows: 0,
    withIssues: 0,
    notMapEligible: 0,
    notConnected: 0,
    hiddenOrUnlisted: 0,
  }

  if (!admin) {
    return { groups: [], summary: emptySummary }
  }

  const [trucksRes, appsRes, authByEmail] = await Promise.all([
    admin
      .from("trucks")
      .select(
        "id, name, slug, email, show_in_directory, is_active, status, active, photo_url, hero_photo_url, serving_today, latitude, longitude, today_location, street_address, source_application_id, updated_at, created_at"
      )
      .order("name", { ascending: true }),
    admin
      .from("vendor_applications")
      .select("id, business_name, email, status, approved_truck_id, updated_at, created_at")
      .order("created_at", { ascending: false }),
    fetchAuthEmailIndex(admin),
  ])

  if (trucksRes.error) console.error("[vendor-status-audit] trucks:", trucksRes.error.message)
  if (appsRes.error) console.error("[vendor-status-audit] applications:", appsRes.error.message)

  const trucks = (trucksRes.data ?? []) as TruckRow[]
  const applications = (appsRes.data ?? []) as ApplicationRow[]

  const { duplicateEmails, duplicateNames } = truckDuplicateKeys(trucks)

  const appByTruckId = new Map<string, ApplicationRow>()
  const appById = new Map<string, ApplicationRow>()
  for (const app of applications) {
    appById.set(app.id, app)
    if (app.approved_truck_id) appByTruckId.set(app.approved_truck_id, app)
  }

  const truckIds = new Set(trucks.map((t) => t.id))
  const groupedAppIds = new Set<string>()
  const groups: VendorStatusAuditGroup[] = []

  for (const truck of trucks) {
    const primaryApp =
      appByTruckId.get(truck.id) ??
      (truck.source_application_id ? appById.get(truck.source_application_id) ?? null : null)
    if (primaryApp) groupedAppIds.add(primaryApp.id)

    const linkedApplications: VendorStatusAuditRow[] = []
    for (const app of applications) {
      if (app.id === primaryApp?.id) continue
      if (app.approved_truck_id && app.approved_truck_id !== truck.id) continue
      if (app.approved_truck_id === truck.id) {
        groupedAppIds.add(app.id)
        linkedApplications.push(
          buildApplicationRow(
            app,
            "historical_application",
            computeHistoricalApplicationIssues(app),
            adminVendorsUrl,
            authByEmail
          )
        )
        continue
      }
      if (appMatchesTruck(app, truck)) {
        groupedAppIds.add(app.id)
        linkedApplications.push(
          buildApplicationRow(
            app,
            "historical_application",
            computeHistoricalApplicationIssues(app),
            adminVendorsUrl,
            authByEmail
          )
        )
      }
    }

    linkedApplications.sort((a, b) =>
      (b.lastUpdated ?? "").localeCompare(a.lastUpdated ?? "")
    )

    const primary = buildTruckRow(truck, {
      primaryApplicationStatus: primaryApp?.status ?? null,
      applicationId: primaryApp?.id ?? truck.source_application_id ?? null,
      duplicateEmails,
      duplicateNames,
      authByEmail,
      adminVendorsUrl,
    })

    const primarySev = countSeverities([primary])
    const linkedSev = countSeverities(linkedApplications)

    groups.push({
      groupKey: `truck-${truck.id}`,
      displayName: primary.truckName,
      groupClassification: classifyVendorAuditGroup(primary),
      primary,
      linkedApplications,
      highestSeverity: primarySev.highest,
      criticalCount: primarySev.critical + linkedSev.critical,
      actionCount: primarySev.action + linkedSev.action,
      infoCount: primarySev.info + linkedSev.info,
      isReadyTruck:
        primary.visibleOnDirectory &&
        primary.eligibleForLiveMap &&
        primary.canAccessGoLiveDashboard &&
        primarySev.critical === 0 &&
        primarySev.action === 0,
    })
  }

  for (const app of applications) {
    if (groupedAppIds.has(app.id)) continue
    if (app.approved_truck_id && truckIds.has(app.approved_truck_id)) continue

    const primary = buildApplicationRow(
      app,
      "application_only",
      computeStandaloneApplicationIssues({
        app,
        duplicateEmails,
        duplicateNames,
        authByEmail,
      }),
      adminVendorsUrl,
      authByEmail
    )

    const primarySev = countSeverities([primary])
    groups.push({
      groupKey: `app-${app.id}`,
      displayName: primary.truckName,
      groupClassification: classifyVendorAuditGroup(primary),
      primary,
      linkedApplications: [],
      highestSeverity: primarySev.highest,
      criticalCount: primarySev.critical,
      actionCount: primarySev.action,
      infoCount: primarySev.info,
      isReadyTruck: false,
    })
  }

  const severityRank = (g: VendorStatusAuditGroup): number => {
    if (g.highestSeverity === "critical") return 0
    if (g.highestSeverity === "action") return 1
    if (g.highestSeverity === "info") return 2
    return 3
  }

  groups.sort((a, b) => {
    const sr = severityRank(a) - severityRank(b)
    if (sr !== 0) return sr
    return a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" })
  })

  const historicalApplicationRecords = groups.reduce((n, g) => n + g.linkedApplications.length, 0)
  const applicationOnlyRecords = groups.filter((g) => g.primary.rowType === "application_only").length
  const productionGroups = groups.filter(isProductionGroup)
  const internalTestRecords = groups.length - productionGroups.length

  const summary: VendorStatusAuditSummary = {
    usedServiceRole: true,
    totalGroups: groups.length,
    readyTruckProfiles: productionGroups.filter((g) => g.isReadyTruck).length,
    criticalBlockers: productionGroups.filter((g) => countSeverities([g.primary]).critical > 0).length,
    needsCleanup: productionGroups.filter((g) => {
      const ps = countSeverities([g.primary])
      return ps.critical === 0 && !g.isReadyTruck && (ps.action > 0 || g.primary.rowType === "application_only")
    }).length,
    internalTestRecords,
    applicationOnlyRecords,
    historicalApplicationRecords,
    totalRows: groups.length + historicalApplicationRecords,
    truckRows: groups.filter((g) => g.primary.rowType !== "application_only").length,
    applicationOnlyRows: applicationOnlyRecords,
    withIssues: groups.filter((g) => g.highestSeverity !== "ready").length,
    notMapEligible: groups.filter((g) => !g.primary.eligibleForLiveMap && g.primary.rowType !== "application_only").length,
    notConnected: groups.filter((g) =>
      g.primary.issues.some((i) => i.flag === "not_connected_to_vendor_account")
    ).length,
    hiddenOrUnlisted: groups.filter((g) => !g.primary.visibleOnDirectory && g.primary.rowType !== "application_only").length,
  }

  return { groups, summary }
}

/** @deprecated use fetchVendorStatusAudit */
export async function fetchVendorStatusAuditRows(adminVendorsUrl: string) {
  const { groups, summary } = await fetchVendorStatusAudit(adminVendorsUrl)
  const rows = groups.flatMap((g) => [g.primary, ...g.linkedApplications])
  return { rows, summary, groups }
}
