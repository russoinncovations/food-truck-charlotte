# Food Truck Charlotte

Food Truck Charlotte is a community-powered local media, discovery, and booking-intent website for the Charlotte food truck scene.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Local mock data (no database in v1)
- Ready to deploy on Vercel

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open the app:
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

No environment variables are required for the current version.
