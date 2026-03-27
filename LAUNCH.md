# Food Truck Charlotte Launch Steps

## 1) Environment variables (forms → email)

Inquiry forms need Resend. Copy and edit:

```bash
cp .env.example .env.local
```

Set `RESEND_API_KEY`, `INQUIRY_TO_EMAIL`, and `RESEND_FROM_EMAIL` (see README). On Vercel, add the same variables under **Settings → Environment Variables** for Production.

## 2) Final local verification

```bash
npm install
npm run lint
npm run build
```

## 3) Login to Vercel (one-time, interactive)

```bash
npx vercel login
```

## 4) Link this folder to a Vercel project

Run inside this project directory:

```bash
npx vercel link
```

Recommended answers:
- Scope: your personal/team account
- Link to existing project: `No`
- Project name: `food-truck-charlotte`

## 5) Deploy production

```bash
npx vercel --prod
```

## 6) Add your domain

```bash
npx vercel domains add foodtruckclt.com
npx vercel domains add www.foodtruckclt.com
```

Then set DNS records in your domain registrar based on Vercel prompts.

## 7) Confirm live SEO endpoints

After production deploy, verify:
- `/sitemap.xml`
- `/robots.txt`
- `/opengraph-image`

## 8) Optional post-launch checks

- Submit sitemap to Google Search Console
- Verify social link previews (Facebook, X, LinkedIn)
- Turn on Vercel Analytics if desired
