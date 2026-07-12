# boppi

[![Live demo](https://img.shields.io/badge/try_boppi-live-191919?style=flat-square&logo=vercel&logoColor=white)](https://boppi.vercel.app)
[![Bun](https://img.shields.io/badge/built_with-Bun-f9f1e1?style=flat-square&logo=bun&logoColor=14151a)](https://bun.sh)
[![Next.js](https://img.shields.io/badge/Next.js-14-191919?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![Convex](https://img.shields.io/badge/backend-Convex-ff6b5b?style=flat-square)](https://convex.dev)

![Boppi preview](https://boppi.vercel.app/opengraph-image)

## Little moments. One tiny song.

Boppi is a private room for 2–4 friends. Everyone adds one photo and one feeling. Together, they become a tiny song you can share.

**[Open Boppi →](https://boppi.vercel.app)**

## Why it is fun

- One little thing per person, per day
- A playful shared room instead of a feed
- A tiny song made from the room’s moments
- A public, read-only link to share with friends

## Built with

Next.js · React · TypeScript · Bun · Convex · Web Audio · Vercel

## Run it

```bash
bun install
bunx convex dev
bun run dev
```

Open [localhost:3000](http://localhost:3000).

## Optional AI sound layer

The app works without provider keys using browser-generated music. To enable the optional Gemini + ElevenLabs layer, add these to the **production Convex deployment**—not `.env.local` and not `NEXT_PUBLIC_*` values:

```bash
bunx convex env set GEMINI_API_KEY "..." --prod
bunx convex env set ELEVENLABS_API_KEY "..." --prod
```

The calls happen in the background after a photo is added. Convex still handles the room, database, realtime updates, and storage either way.

## Links

- [Live app](https://boppi.vercel.app)
- [GitHub](https://github.com/pol-cova/boppi)

Made for close friends and ordinary good days.
