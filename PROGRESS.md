# PROGRESS

## 2026-11-26 (app icons, branch `app-icons`)

- Favicon (`app/favicon.ico`, 16/32/48), tab icon (`app/icon.png`), iOS home-screen icon (`app/apple-icon.png`), install icons in `public/` and a web app manifest (`app/manifest.ts`), all from the app's own mascot. `app/layout.tsx` metadata sets the app name for iOS.
- Gotcha: Next.js rejects an `.ico` whose entries are BMP (what ffmpeg writes). The entries must be PNG; the icons were rendered by Chrome at their exact sizes and packed by a small script (scratchpad, not in the repo).
- IMPORTANT: Gemini's free tier allows 20 requests per day on `gemini-4-hydrogen` and `gemini-3.8-flash`. Testing on 2026-11-26 used both up; the app runs on the two flash-lite fallbacks until the quota resets (about 18 h from 14:50 UTC+1), and falls back to the rules if those run out too.

## 2026-11-26 (photo wardrobe)

- Merged into `main` (aad56de, fast-forward from branch `photo-wardrobe`) and deployed to https://fits-steel.vercel.app. The 8-step browser run and `check:photo` both passed against the live site.
- Baseline finding: the photo tagging on `main` already read real photos correctly (Omar's hoodie -> mid layer, warmth 3, not waterproof). The gaps were around it.
- Changes: `/api/wardrobe/analyze` also returns `why` (one sentence of Gemini's reasoning); the add-item form has "Take a photo" (rear camera) and "Choose a photo", shows a preview and the reasoning; the wardrobe keeps a 160 px thumbnail, material and colour per item and sends material/colour to `/api/recommend`; trousers and shoes are real layers now (`LAYERS`/`LAYER_LABEL` in `src/types.ts` is the one list every component reads).
- Proof: `npm run check:photo -- photo.jpg` (repeatable, in the repo). An 8-step Playwright run with real crops from the team's clips (hoodie, jeans, a building) passed; that script and the photos are in the session scratchpad, not the repo, because the repo is public and the photos show people.
- Not tested: a real phone's camera capture; shoes from a real photo.

## 2026-11-26 (pitch video: real cut)

- `video-out/frosty-pitch-v3.mp4`: 39.6 s, 1920x1080, with Zoha's snow intro, Zoha's and Omar's clips, word-timed captions, the app demo cued to what they say, and the QR end card. Master (46 Mbps) is `~/Studio/fits-video/projects/frosty-pitch/out/pitch-v3.mp4`.
- Takes are in the video project's `media/takes` (`snow-intro.mp4`, `zoha-why.mov`, `omar-how.mov`): audio cleaned and levelled with ffmpeg, fades baked in (raea's `fadeOut` did not apply at a clip that ends at its source's end). Transcripts: `NAME.words.json`, made by `raea cut TAKE "the"`.
- `pitch.tsx` builds its own timeline words and `cue("phrase")` from those transcripts, so trims in the clip list move captions and app screens with them. Omar's "your, your" stumble is cut (10.24-10.44 s).
- Fonts Outfit-600 and DMSans-500 downloaded to `media/fonts` for captions. Logo and end-card chime is synthesised (`media/sound/chime.wav`).
- Still a stand-in: the jacket image in the photo-tagging beat is a drawing, not a real photo.

## 2026-11-26 (pitch video started)

- 59 s pitch video lives OUTSIDE this repo, in the raea workspace `~/Studio/fits-video/projects/frosty-pitch` (raea refuses a workspace inside a git repo). Composition: `pitch.tsx`; plan: `brief.ts`, `pitch.script.ts`; real app captures in `media/app`, brand PNGs in `media/brand`.
- Timeline: 0-11 s snow intro, 11-13.5 logo, 13.5-30 Zoha "why" + demo, 30-53 Omar "how" + demo, 53-59 QR end card.
- First cut with placeholders: `video-out/frosty-pitch-previz-v1.mp4` (git-ignored). Render: `raea render pitch.tsx -o out/NAME.mp4` (8 s). Capture scripts are in the session scratchpad and may be gone; app screens were captured with Playwright (`channel: 'chrome'`) from https://fits-steel.vercel.app.
- Waiting on: the snow clip, Zoha's clip (16 s max), Omar's clip (22 s max), a real jacket photo for the photo-tagging beat. Fonts Outfit/DM Sans are not installed, so brand text is PNG; word-timed captions would need the font files.

## 2026-11-26 (deployed)

- Live at https://fits-steel.vercel.app (Vercel project `fits`, team "Omar's projects"). Deployed with `vercel --prod` from the CLI: the GitHub repo is NOT connected to Vercel (connection failed), so pushes do not auto-deploy. Redeploy with `vercel --prod --yes`.
- `GEMINI_API_KEY` is set on Vercel (production, sensitive). Verified live: page, `/api/weather`, `/api/recommend` (`source: gemini`), `/api/wardrobe/analyze`, place lookup for Wales.
- Gotcha: the RTK hook rewrites `grep` output, so never pipe `grep` into a command that stores a value. The first key upload was mangled this way; extract values with python instead.

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
