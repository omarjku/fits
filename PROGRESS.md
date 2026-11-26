# PROGRESS

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
- `GEMINI_API_KEY` in `.env.local`: the two Gemini paths are written but not yet run against the real API.
- Merge with Zoha's frontend, deploy (needed for the QR code), set the key on the host.

**Commands**: `npm run dev`, `npm test`, `npx tsc --noEmit`. Repo: github.com/omarjku/fits, branch `backend`.
