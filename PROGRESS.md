# PROGRESS

## 2026-11-26 (afternoon): Zoha's frontend connected

- Zoha pushed a Vite + React app ("Frosty", mock data) to branch `frosty-app`, unrelated history. Merged into `main` and moved into the Next.js app: `app/layout.tsx` + `app/page.tsx` render `src/App.tsx` client-only (it reads localStorage while rendering). Tailwind v4 via `postcss.config.mjs`. Removed `index.html`, `vite.config.ts`, `src/main.tsx`, `src/vite-env.d.ts`. `npm run dev` now starts everything.
- `src/api.ts` rewritten: same exports, real calls to `/api/*`. It maps her types (4 layers, `waterRepellent`, warmth slider 0-100, five activities) to the backend's.
- Backend extended for her screens: `place` lookup by name (Wales is seeded: the geocoder finds a Yorkshire village), country names, 10-year averages with temp/wind/precip, `hourly` (now + 12 h), `now.rainMm`/`snowCm`, a `reason` per outfit item.
- UI additions in her components: error cards in `App.tsx`; a photo control in the add-item form (`WardrobeCard.tsx`) that fills the fields via Gemini.
- Checked in the browser at phone width: onboarding, both weather cards, outfit, Wales comparison, photo tagging. `next build` passes.
- Known gaps: her wardrobe has no trousers or shoes, so a photo of those is declined; real phone photos untested; nothing deployed.

## 2026-11-26 (later): Gemini verified with a real key

- Both Gemini paths run against the live API: `/api/recommend` returns `source: "gemini"`, `/api/wardrobe/analyze` tagged a jacket image and rejected a non-clothing image (422). Real phone photos not tried yet.
- Fixes found while testing: SDK must use `apiVersion: 'v1beta'` (image input is rejected on v1); `maxRetries: 0` + 15 s timeout (default retries hung a request for 2 min); models tried in order `gemini-4-hydrogen, gemini-3.8-flash, gemini-3.5-flash-lite, gemini-3.1-flash-lite` because the free tier often answers 503/429 on the first two; a required slot Gemini skips is filled from the rules.
- Cap of 60 Gemini attempts/min per instance, each model tried counts (endpoints are public, no auth). Also set a quota cap on the key.
- Free tier: 5 requests/min on gemini-4-hydrogen, limits are per Google project, so teammates on the same project share them.

- `backend` fast-forwarded into `main` (5bccecc); main had only the README. Work on `main` from here.

**Pending**: Zoha adds the frontend (`app/page.tsx` etc.) on top of `main`, deploy, set `GEMINI_API_KEY` on the host.

## 2026-11-26: backend built (hackathon, 3 h total)

**What exists**
- Next.js 16 app with API routes only, no UI (Zoha builds the frontend in Next.js).
- `lib/weather.ts`: postcode -> Open-Meteo forecast for the next N hours, past-week baseline, 5-year "same week" average. Postcode lookup via zippopotam.us; 4020 Linz is seeded.
- `lib/outfit.ts`: pure rules (weather + questionnaire -> warmth target, waterproof/windproof needs) and a rule-based outfit picker. Tests: `npm test`.
- `lib/gemini.ts`: `@google/genai` Interactions API, model `gemini-4-hydrogen` (override with `GEMINI_MODEL`). Tags a clothing photo; picks the outfit. Falls back to the rules if Gemini fails.
- Routes: `GET /api/weather`, `GET /api/wardrobe/demo`, `POST /api/wardrobe/analyze`, `POST /api/recommend`. Contract for the frontend: `API.md`.

**Decisions**
- Stateless backend: the frontend stores the wardrobe and sends it with `/api/recommend`.
- Questionnaire = postcode, activity (low/moderate/high), warmthPref (1-5), hours. One postcode, time counted from now.
- Gemini docs changed in 2026: use `client.interactions.create` + `response_format`, not `generateContent`.

**Pending**
- Merge with Zoha's frontend, deploy (needed for the QR code), set the key on the host.

**Commands**: `npm run dev`, `npm test`, `npx tsc --noEmit`. Repo: github.com/omarjku/fits, branch `main`.
