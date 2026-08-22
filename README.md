# festivaloftrust.com

Website for the Festival of Trust.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · TypeScript

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

```bash
npm run build   # production build
npm run lint    # eslint
```

## Deployment

Hosted on Vercel, connected to this repo:

- Push to `main` → deploys to production at https://festivaloftrust.com
- Any other branch / PR → gets its own preview URL

DNS is managed at TransIP. The apex `A` record and the `www` `CNAME` point at
Vercel; the exact values are project-specific and shown on the domain card in
Vercel under **Settings → Domains**.

Note: TransIP's **"TransIP-instellingen"** toggle must stay **off**, or it will
overwrite these DNS records with its own defaults.
