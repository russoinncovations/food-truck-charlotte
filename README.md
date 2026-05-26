# FoodTruck CLT

FoodTruckCLT is a community-powered Charlotte food truck platform with:

- **Live map** — real-time pins and what's happening now
- **Vendor dashboards** — truck profile, photos, go-live, requests to confirm
- **Admin command center** — bookings, vendors, events, housekeeping (e.g. missing images), vendor email engagement
- **Truck listings** — public discovery
- **Event promotion** — public events surfaced with admin-managed imagery
- **Booking request routing** — specific vendors, cuisines/categories, and open-market requests where applicable
- **Phone / home-screen shortcuts** — consumer and vendor manifests (see PWA section)

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres database + auth)
- Resend (transactional and vendor-facing email)
- Google Maps (`@vis.gl/react-google-maps`)
- Vercel (typical deployment)
- PWA-style manifests and home-screen icons

## Environment variables

Create `.env.local` for local development (never commit secrets). On Vercel, set **Production** (and **Preview**/`Development` if you use them) then redeploy after changes.

**Supabase**

| Variable | Role |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public anon client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; bypasses RLS for trusted jobs (service role) |

Missing Supabase URLs/keys breaks auth, dashboards, and any screens that load live data.

**Email (Resend + forms)**

| Variable | Role |
| --- | --- |
| `RESEND_API_KEY` | Send mail via Resend |
| `RESEND_FROM_EMAIL` | Verified sender |
| `INQUIRY_TO_EMAIL` | Inbox for public inquiry/booking-intent flows |
| `RESEND_WEBHOOK_SECRET` | Verifies **`POST /api/resend/webhook`** (Svix signing secret from Resend). If unset, the route returns **503** `{"error":"webhook not configured"}`. |

Missing Resend/form variables breaks outbound email and form submission paths that depend on them.

**Admin**

| Variable | Role |
| --- | --- |
| `ADMIN_KEY` | Shared secret for admin UI actions (set a strong value in production; do not rely on defaults). |

**Maps**

| Variable | Role |
| --- | --- |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Map tiles / Places as used in the app |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Map styling (optional but used where configured) |

Optional: `NEXT_PUBLIC_ROOT_DOMAIN` — used for subdomain-aware routing in some helpers (defaults toward production apex if unset).

## Core product flows

### Public live map

Real-time truck pins and events that are “on” now, built on Google Maps.

### Vendor dashboard

Truck profile and photos, go-live / live location, and booking or opportunity requests that need vendor confirmation. Truck ownership is tied to the signed-in user by **matching the session email to `trucks.email`** (see Supabase).

### Admin command center

Operational views for bookings, vendors, events, gaps (e.g. missing photos/images), and vendor email engagement fed by the Resend webhook.

### Booking requests

Flows support routing to a **specific vendor**, **cuisine/category** matching, and **open** requests where the product rules allow it.

### Truck opportunities

Opportunities appear as rows in the vendor dashboard for eligible trucks; they are **not** a blast to every vendor by default.

### Event promotion

Public events UX plus admin tooling for images and listings.

### PWA / home-screen

- Consumer-oriented install uses **`start_url: /map`** (default manifest when not on a role subdomain).
- Vendor-oriented install uses **`start_url: /dashboard/live`** (vendor role manifest).
- Admin install uses **`/admin`** when served as the admin role manifest.

## Supabase

- SQL migrations live in **`supabase/migrations/`**.
- Production (and any shared environment) must have migrations applied—manually in the Supabase SQL editor, or via the [Supabase CLI](https://supabase.com/docs/guides/cli) linked to the project.
- Auth is **magic link / email OTP** (no password flow in the usual vendor path).
- Vendor dashboard truck resolution: **logged-in user email ↔ `trucks.email`** until/unless you add explicit user–truck links elsewhere.

### Auth URLs (production)

Primary vendor sign-in for most users today:

`https://www.foodtruckclt.com/vendor-login`

If you serve the app on **`vendor.foodtruckclt.com`** (or other role hosts), add matching callback URLs in **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**, for example:

- `https://www.foodtruckclt.com/auth/callback*`
- `https://vendor.foodtruckclt.com/auth/callback*` (only if that host is in use)

Magic links can include `…/auth/callback?next=…`. If the full callback URL is not allowlisted, Supabase may fall back to **Site URL** (often `www`), which breaks subdomain-only flows.

## Resend

- Resend sends admin, vendor, and customer-facing mail as implemented in the codebase.
- **Webhook:** `POST /api/resend/webhook`
- **Health check:** `GET /api/resend/webhook` returns JSON (`ok`, `endpoint`, `methods`, `message`) so you can confirm the route is deployed from a browser.
- Configure events such as **sent**, **delivered**, **opened**, **clicked**, **bounced**, **failed**, **complained** (the handler recognizes those Resend event types and records what it can).
- **Verification:** Resend signs webhooks with **Svix** (`svix-id`, `svix-timestamp`, `svix-signature`). The app verifies with the **`svix`** package and **`RESEND_WEBHOOK_SECRET`** (signing secret from Resend, often `whsec_…`).
- **Production:** If **`RESEND_WEBHOOK_SECRET`** is missing, `POST` returns **503** `webhook not configured` (no fake success).
- **Local:** With `NODE_ENV=development` and **no** `RESEND_WEBHOOK_SECRET`, `POST` accepts **unsigned** JSON for manual testing (body is logged truncated). With the secret set locally, verification behaves like production.
- **Open** tracking is approximate; **click** tracking tends to be more reliable for engagement.

## PWA / home-screen icons

- Regenerate raster icons after changing the master asset:

  ```bash
  npm run generate:pwa-icons
  ```

- Source image: **`scripts/assets/ftclt-app-icon.png`**
- OSes often **cache** home-screen icons; after updates, users may need to remove and re-add the shortcut to see new artwork.

## Local development

```bash
npm install
npm run dev
```

Optional checks:

```bash
npm run build
npm run generate:pwa-icons
```

Open [http://localhost:3000](http://localhost:3000); if port 3000 is taken, Next.js picks another.

## Project structure (short)

- `app/` — routes, layouts, API routes
- `components/` — UI
- `lib/` — shared logic (Supabase clients, email, admin helpers, etc.)
- `supabase/migrations/` — database migrations
- `scripts/` — icon generation and assets

## Vercel deployment

1. Connect the repo and use the default Next.js settings.
2. Add all required environment variables for **Production**.
3. Deploy / redeploy after env changes.

For inquiry-style forms: `RESEND_API_KEY`, `INQUIRY_TO_EMAIL`, and a verified `RESEND_FROM_EMAIL` (or Resend’s documented test sender in development) must be set; add **`RESEND_WEBHOOK_SECRET`** if you use the Resend webhook in that environment.
