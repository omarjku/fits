# Fits backend: API for the frontend

The backend is four Next.js route handlers in `app/api/` plus logic in `lib/`. It keeps no state: the
frontend holds the wardrobe in `localStorage` and sends it with each recommendation request.

The frontend is Zoha's Frosty app in `src/`, rendered by `app/page.tsx`. `src/api.ts` is the only file
that talks to these routes; it converts between the shapes below and the app's own types in `src/types.ts`.

Run it: copy `.env.example` to `.env.local`, add `GEMINI_API_KEY`, then `npm install && npm run dev`.

Every error is `{ "error": "human-readable message" }` with a 4xx/5xx status. Show `error` to the user.

## The questionnaire maps to one request

| Question | Field | Values |
|---|---|---|
| Postcode | `postcode` (+ optional `country`: a code like `"AT"` or a name like `"Austria"`, default `"AT"`) | `"4020"` |
| Trip destination | `place` instead of `postcode` | `"Wales"` |
| Activity | `activity` | `"low"` standing or sitting outside, `"moderate"` walking, `"high"` sport or cycling |
| Warmth preference | `warmthPref` | `1` always cold … `3` normal … `5` always hot |
| Hours outside | `hours` | `1`–`48`, counted from now |

## `GET /api/weather?postcode=4020&country=AT&hours=3`

For the "today's weather" and "historical weather" cards. Use `?place=Wales` to look a place up by name instead.

```jsonc
{
  "place": { "postcode": "4020", "country": "AT", "name": "Linz", "lat": 48.3064, "lon": 14.2861 },
  "now": { "time": "2026-11-26T12:00", "temp": 1, "feelsLike": -2.9, "wind": 10.5, "humidity": 85, "rainMm": 0, "snowCm": 0.9, "condition": "snow" }, // rain and snow are for this hour
  "window": {            // the next `hours` hours
    "hours": 3, "from": "2026-11-26T12:00", "to": "2026-11-26T15:00",
    "tempMin": 0.9, "tempMax": 1.1, "feelsLikeMin": -2.9, "feelsLikeAvg": -2.3,
    "windMax": 10.5, "gustMax": 24.1, "precipMm": 4.1, "precipProbMax": 100, "snowCm": 2.9,
    "humidityAvg": 86, "condition": "snow"
  },
  "history": {
    "lastWeekFeelsLike": 0.4,   // average feels-like over the past 7 days (07:00-22:00)
    "vsLastWeek": -2.7,         // negative = colder than you are used to
    "typical": { "years": 10, "feelsLike": -0.4, "feelsLikeMin": -3, "temp": 2.8, "tempLow": 0.3, "tempHigh": 5.6, "windMax": 14.3, "precipMmPerDay": 1.4, "snowDayShare": 0.2 }, // same week, past 10 years; may be null
    "vsTypical": -0.8,
    "summary": "Feels 3° colder than the past week in Linz, and about the same as a typical late-November day here (10-year average)."
  },
  "hourly": [ { "time": "2026-11-26T12:00", "temp": 1, "feelsLike": -2.9, "precipProb": 100 } /* now + the next 12 hours, for a chart */ ]
}
```

Temperatures are °C, wind km/h, rain mm, snow cm. `condition` is one of
`clear, cloudy, fog, drizzle, rain, snow, rain showers, snow showers, thunderstorm`.

## `GET /api/wardrobe/demo`

`{ "items": Item[] }`: 20 pre-tagged items so the app works before any photo is uploaded.

```ts
type Item = {
  id: string
  name: string
  slot: 'base' | 'mid' | 'outer' | 'bottom' | 'shoes' | 'accessory'
  warmth: number        // 0 (umbrella) to 5 (winter coat)
  waterproof: boolean
  windproof: boolean
  material: string
  color: string
  emoji?: string        // demo items only
}
```

## `POST /api/wardrobe/analyze`

Gemini looks at one photo and tags it. Body: `{ "image": "data:image/jpeg;base64,..." }` (jpeg, png, webp, heic).
Resize to about 1024 px on the long side before sending: the request limit is about 3 MB.

Returns `{ "item": Item }` with a fresh `id`. Keep the photo on the frontend next to that `id`.
`422` if the photo is not clothing, `503` if the Gemini key is missing.

## `POST /api/recommend`

```json
{ "postcode": "4020", "activity": "low", "warmthPref": 1, "hours": 5, "wardrobe": [ /* Item[] */ ] }
```

Leave `wardrobe` out (or empty) to use the demo wardrobe. Send `place` instead of `postcode` for a trip
destination. Optional `activityName` (e.g. `"skiing"`) is passed to Gemini so the wording fits. A wardrobe
without bottoms or shoes is fine: the outfit then covers the layers it has.

```jsonc
{
  "items": [ /* the chosen Item objects, base layer first, each with a short "reason" */ ],
  "headline": "Feels like -3° in Linz",
  "explanation": "Two or three sentences on why these layers.",
  "tips": ["Up to two short tips"],
  "source": "gemini",          // "rules" if Gemini was unavailable and the built-in rules picked the outfit
  "usedDemoWardrobe": false,
  "needs": { "effectiveTemp": -11.9, "topWarmth": 15, "bottomWarmth": 4, "waterproof": true, "windproof": false, "accessories": true, "reasons": ["..."] },
  "prefs": { "activity": "low", "warmthPref": 1, "hours": 5 },
  "weather": { /* same object as GET /api/weather */ }
}
```

```ts
const res = await fetch('/api/recommend', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ postcode, activity, warmthPref, hours, wardrobe }),
})
const data = await res.json()
if (!res.ok) showError(data.error)
```
