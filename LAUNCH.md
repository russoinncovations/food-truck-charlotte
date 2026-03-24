# Food Truck Charlotte Launch Steps

## 1) Final local verification

```bash
npm install
npm run lint
npm run build
```

## 2) Login to Vercel (one-time, interactive)

```bash
npx vercel login
```

## 3) Link this folder to a Vercel project

Run inside this project directory:

```bash
npx vercel link
```

Recommended answers:
- Scope: your personal/team account
- Link to existing project: `No`
- Project name: `food-truck-charlotte`

## 4) Deploy production

```bash
npx vercel --prod
```

## 5) Add your domain

```bash
npx vercel domains add foodtruckclt.com
npx vercel domains add www.foodtruckclt.com
```

Then set DNS records in your domain registrar based on Vercel prompts.

## 6) Confirm live SEO endpoints

After production deploy, verify:
- `/sitemap.xml`
- `/robots.txt`
- `/opengraph-image`

## 7) Optional post-launch checks

- Submit sitemap to Google Search Console
- Verify social link previews (Facebook, X, LinkedIn)
- Turn on Vercel Analytics if desired
