# Boppi

[![Live demo](https://img.shields.io/badge/live-boppi.vercel.app-191919?style=flat-square&logo=vercel&logoColor=white)](https://boppi.vercel.app)
[![Built with Bun](https://img.shields.io/badge/runtime-Bun-f9f1e1?style=flat-square&logo=bun&logoColor=14151a)](https://bun.sh)
[![Next.js](https://img.shields.io/badge/Next.js-14-191919?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![Convex](https://img.shields.io/badge/backend-Convex-ff6b5b?style=flat-square)](https://convex.dev)

## Little moments. One tiny song.

Boppi is a private, invite-only room where two to four people each share one photo and one small caption. Boppi turns those ordinary moments into musical layers—bass, atmosphere, percussion, or melody—and brings them together as a tiny collaborative song.

It is a social product built around creating something together, not scrolling past each other.

**[Open the live demo →](https://boppi.vercel.app)**

## What is included

- Private rooms with opaque invite codes and anonymous browser sessions
- One daily photo + caption per person, with Convex Storage uploads
- Realtime room updates through Convex reactive queries
- Four validated musical roles and a staged “making the bop” reveal
- Browser-generated 18-second playback with optional stored sound-effect layers
- Google Gemini image interpretation and ElevenLabs sound-generation hooks
- Public read-only bop pages with share metadata and playback
- A small archive of previous daily songs
- SEO metadata, Open Graph image, sitemap, manifest, and robots rules
- Security headers and a narrowly scoped Content Security Policy
- Vercel production deployment with Convex functions deployed in the build

## Stack

| Layer | Technology |
| --- | --- |
| Web | Next.js App Router, React, TypeScript |
| Styling | Custom CSS, Bricolage Grotesque, Newsreader, DM Mono |
| Backend | Convex queries, mutations, actions, scheduler |
| Storage | Convex File Storage for photos and generated MP3s |
| Audio | Web Audio API with optional ElevenLabs clips |
| Hosting | Vercel |
| Tooling | Bun |

## Run locally

```bash
bun install
bunx convex dev
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

`bunx convex dev` connects the local app to a Convex development deployment and regenerates the typed Convex bindings in `convex/_generated`.

## Environment variables

`.env.local` is created by Convex and is intentionally ignored by Git. Provider keys belong in Convex environment variables or Vercel’s encrypted environment variables—not in client-side `NEXT_PUBLIC_*` values.

```text
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.0-flash
ELEVENLABS_API_KEY=...
```

`GEMINI_MODEL` is optional; the current fallback is `gemini-2.0-flash`. Gemini receives the uploaded image and caption and returns a validated interpretation. ElevenLabs uses the `ELEVENLABS_API_KEY` with its sound-generation API to create a short MP3 layer.

The app remains fully usable without either provider key: it falls back to deterministic role interpretations and browser synthesis, which keeps the hackathon demo reliable.

## Deploy to Vercel

The repository includes `vercel.json`:

```json
{
  "installCommand": "bun install --frozen-lockfile",
  "buildCommand": "bun run vercel-build"
}
```

`vercel-build` runs `convex deploy --cmd "bun run build"`, so the Convex production functions and Next.js frontend ship together. Add a production `CONVEX_DEPLOY_KEY` in Vercel before deploying.

```bash
bunx vercel login
bunx vercel link
bunx vercel --prod
```

## Privacy and safety

- Rooms are private by default and discoverable only through an invite code.
- Invite codes and public share codes are separate opaque random tokens.
- Public pages expose only the moments included in that specific song.
- Photo upload URLs require an active room session.
- API keys never enter the browser bundle.
- Camera, microphone, geolocation, and payment permissions are disabled by policy.
- The app sets CSP, `X-Frame-Options`, strict referrer policy, and MIME-sniffing protection headers.

## Project shape

```text
app/
  page.tsx                  room UI and landing experience
  b/[shareCode]/page.tsx    public read-only bop page
  components/               shared playback UI
  opengraph-image.tsx       social preview image
convex/
  schema.ts                 groups, members, moments, songs
  groups.ts                 room, upload, song, archive functions
  ai.ts                     optional Gemini + ElevenLabs action
  aiQueries.ts              internal AI data access
```

## License

This project is a hackathon MVP. Add a license before distributing it as an open-source package.
