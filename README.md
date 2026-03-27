# Food Truck Charlotte

Food Truck Charlotte is a community-powered local media, discovery, and booking-intent website for the Charlotte food truck scene.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Local mock data (no database in v1)
- Ready to deploy on Vercel

## Environment variables (forms & email)

Inquiry forms (**Book a Truck**, **For Trucks**, **For Venues**) send email via [Resend](https://resend.com).

1. Copy the example env file and fill in values:
   ```bash
   cp .env.example .env.local
   ```
2. Set:
   - **`RESEND_API_KEY`** — from the Resend dashboard (API Keys).
   - **`INQUIRY_TO_EMAIL`** — the inbox that should receive submissions.
   - **`RESEND_FROM_EMAIL`** — sender address. For production, use an address on a domain you verify in Resend. For initial testing, Resend documents using `onboarding@resend.dev` with their test flow.

3. Restart `npm run dev` after changing `.env.local`.

### Vercel

1. Project → **Settings** → **Environment Variables**.
2. Add the same keys for **Production** (and **Preview** if you want forms to work on preview deploys).
3. Redeploy so the new variables apply.

Without these variables, form submissions show a **configuration error** instead of sending email.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env.local` (see [Environment variables](#environment-variables-forms--email) above).
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open the app:
   - [http://localhost:3000](http://localhost:3000)
   - If port 3000 is in use, Next.js will choose another port.

## Project Structure

- `app/` route pages and layout
- `components/` reusable UI building blocks
- `data/` mock truck and event datasets
- `lib/` shared helpers and types

## Included Launch Basics

- Page-level metadata for SEO
- Open Graph + Twitter preview image route (`app/opengraph-image.tsx`)
- Crawl files: `app/sitemap.ts` and `app/robots.ts`
- Responsive mobile-first layouts and forms

## Vercel Deployment

1. Push this repo to GitHub.
2. Import the project into [Vercel](https://vercel.com/new).
3. Use default Next.js settings.
4. Deploy.

**Required for working inquiry forms:** `RESEND_API_KEY`, `INQUIRY_TO_EMAIL`, and a verified `RESEND_FROM_EMAIL` (or Resend’s documented test sender for development). See [Environment variables](#environment-variables-forms--email) above.
