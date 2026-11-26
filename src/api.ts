// All data access lives here. The wardrobe is kept in localStorage; weather, history,
// photo tagging and outfits come from the backend routes in app/api (see API.md).
import type {
  Activity, ClothingItem, Historical, Layer, NewClothing, Preferences, Recommendation, Weather,
} from './types'

const WARDROBE_KEY = 'frosty.wardrobe.v1'

const SEED_WARDROBE: ClothingItem[] = [
  { id: 'w1', name: 'Cotton tee', emoji: '👕', layer: 'base', warmth: 1, waterRepellent: false },
  { id: 'w2', name: 'Merino base layer', emoji: '🩱', layer: 'base', warmth: 2, waterRepellent: false },
  { id: 'w3', name: 'Chunky wool sweater', emoji: '🧶', layer: 'mid', warmth: 3, waterRepellent: false },
  { id: 'w4', name: 'Rain shell', emoji: '🧥', layer: 'outer', warmth: 2, waterRepellent: true },
  { id: 'w5', name: 'Down jacket', emoji: '🥶', layer: 'outer', warmth: 5, waterRepellent: false },
  { id: 'w6', name: 'Wool beanie', emoji: '🧢', layer: 'accessory', warmth: 2, waterRepellent: false },
  { id: 'w7', name: 'Cozy scarf', emoji: '🧣', layer: 'accessory', warmth: 2, waterRepellent: false },
  { id: 'w8', name: 'Waterproof gloves', emoji: '🧤', layer: 'accessory', warmth: 3, waterRepellent: true },
]

let wardrobe: ClothingItem[] | null = null

function loadWardrobe(): ClothingItem[] {
  if (wardrobe) return wardrobe
  try {
    const raw = localStorage.getItem(WARDROBE_KEY)
    if (raw) { wardrobe = JSON.parse(raw) as ClothingItem[]; return wardrobe }
  } catch { /* ignore */ }
  wardrobe = [...SEED_WARDROBE]
  return wardrobe
}

function saveWardrobe() {
  try { localStorage.setItem(WARDROBE_KEY, JSON.stringify(wardrobe)) } catch { /* ignore */ }
}

export async function getWardrobe(): Promise<ClothingItem[]> {
  return [...loadWardrobe()]
}

const EMOJI: Record<Layer, string> = { base: '👕', mid: '🧶', outer: '🧥', bottom: '👖', shoes: '👟', accessory: '🧣' }

export async function addClothing(input: NewClothing): Promise<ClothingItem> {
  const item: ClothingItem = {
    id: 'w' + Date.now(),
    name: input.name.trim(),
    layer: input.layer,
    warmth: input.warmth,
    waterRepellent: input.waterRepellent,
    emoji: input.emoji || EMOJI[input.layer],
    ...(input.photo ? { photo: input.photo } : {}),
    ...(input.material ? { material: input.material } : {}),
    ...(input.color ? { color: input.color } : {}),
  }
  wardrobe = [...loadWardrobe(), item]
  saveWardrobe()
  return item
}

export async function setWaterRepellent(id: string, value: boolean): Promise<void> {
  wardrobe = loadWardrobe().map((i) => (i.id === id ? { ...i, waterRepellent: value } : i))
  saveWardrobe()
}

// ---------- Backend ----------

/** Fetch JSON; a failed request throws an Error carrying the server's message. */
async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? 'Something went wrong. Please try again.')
  return data as T
}

const post = (body: unknown): RequestInit => ({
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
})

// The parts of the backend's weather object this app uses.
interface ApiWeather {
  place: { name: string }
  now: { feelsLike: number; wind: number; humidity: number; rainMm: number; snowCm: number }
  history: {
    typical: { temp: number; tempLow: number; tempHigh: number; windMax: number; precipMmPerDay: number } | null
  }
  hourly: { time: string; temp: number }[]
}

const toWeather = (w: ApiWeather): Weather => ({
  place: w.place.name,
  hourly: w.hourly.map((p) => ({ hour: p.time.slice(11, 16), temp: p.temp })),
  feelsLike: w.now.feelsLike,
  windKmh: w.now.wind,
  humidity: w.now.humidity,
  rainMm: w.now.rainMm,
  snowCm: w.now.snowCm,
})

function toHistorical(w: ApiWeather): Historical {
  const t = w.history.typical
  if (!t) throw new Error(`No weather history available for ${w.place.name} right now.`)
  return { place: w.place.name, avgTemp: Math.round(t.temp), avgLow: Math.round(t.tempLow), avgHigh: Math.round(t.tempHigh), windKmh: Math.round(t.windMax), precipMm: t.precipMmPerDay }
}

// The two weather cards ask for the same data at the same moment: share one request.
const weatherRequests = new Map<string, Promise<ApiWeather>>()

function fetchWeather(prefs: Preferences): Promise<ApiWeather> {
  const url = `/api/weather?${new URLSearchParams({ postcode: prefs.postcode, country: prefs.country, hours: String(prefs.hours) })}`
  let request = weatherRequests.get(url)
  if (!request) {
    request = call<ApiWeather>(url)
    weatherRequests.set(url, request)
    request.finally(() => setTimeout(() => weatherRequests.delete(url), 60_000)).catch(() => {})
  }
  return request
}

export const getWeather = (prefs: Preferences): Promise<Weather> => fetchWeather(prefs).then(toWeather)
export const getHistorical = (prefs: Preferences): Promise<Historical> => fetchWeather(prefs).then(toHistorical)

export const DEFAULT_PREFS: Preferences = {
  postcode: '4020', country: 'Austria', activity: 'walking', warmth: 50, hours: 3,
}

// How much body heat each activity produces, as the backend understands it.
const INTENSITY: Record<Activity, 'low' | 'moderate' | 'high'> = {
  'sitting outside': 'low', commuting: 'moderate', walking: 'moderate', hiking: 'high', skiing: 'high',
}

interface ApiOutfit {
  items: { id: string; reason: string }[]
  explanation: string
  tips: string[]
  weather: ApiWeather
}

/** Outfit for home (the saved postcode) or, when a destination is given, for that place. */
export async function getRecommendation(prefs: Preferences, destination?: string): Promise<Recommendation> {
  const items = loadWardrobe()
  const r = await call<ApiOutfit>('/api/recommend', post({
    ...(destination?.trim() ? { place: destination.trim() } : { postcode: prefs.postcode, country: prefs.country }),
    activity: INTENSITY[prefs.activity],
    activityName: prefs.activity,
    warmthPref: Math.round(prefs.warmth / 25) + 1, // 0..100 slider -> 1 (runs cold) .. 5 (runs hot)
    hours: prefs.hours,
    wardrobe: items.map((i) => ({
      id: i.id, name: i.name, slot: i.layer, warmth: i.warmth,
      waterproof: i.waterRepellent, windproof: i.layer === 'outer' && i.waterRepellent,
      material: i.material, color: i.color, // known for items added from a photo; lets Gemini match fabrics and colours
    })),
  }))
  const byId = new Map(items.map((i) => [i.id, i]))
  return {
    place: r.weather.place.name,
    weather: toWeather(r.weather),
    historical: toHistorical(r.weather),
    items: r.items.flatMap((i) => { const item = byId.get(i.id); return item ? [{ item, reason: i.reason }] : [] }),
    summary: [r.explanation, r.tips[0]].filter(Boolean).join(' '),
  }
}

// ---------- Photo tagging ----------

/** Draw a photo no larger than `max` px on its long side and return it as a JPEG data URL. */
function shrink(bitmap: ImageBitmap, max: number, quality: number): string {
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', quality)
}

interface ApiItem { name: string; slot: Layer; warmth: number; waterproof: boolean; material: string; color: string }

/**
 * Let Gemini look at a photo of a garment. Returns how to file it in the wardrobe (with a thumbnail of the
 * photo to keep) and, in one sentence, what Gemini saw that led it there.
 */
export async function analyzePhoto(file: File): Promise<{ item: NewClothing; why: string }> {
  const bitmap = await createImageBitmap(file).catch(() => { throw new Error('Could not read that photo. Try another one.') })
  // 1024 px is plenty for Gemini to judge fabric and cut and keeps the upload small; 160 px is what the app shows
  const { item, why } = await call<{ item: ApiItem; why: string }>('/api/wardrobe/analyze', post({ image: shrink(bitmap, 1024, 0.85) }))
  return {
    item: {
      name: item.name,
      layer: item.slot, // the backend's six slots are this app's six layers
      warmth: Math.min(5, Math.max(1, item.warmth)) as NewClothing['warmth'],
      waterRepellent: item.waterproof,
      photo: shrink(bitmap, 160, 0.8),
      material: item.material,
      color: item.color,
    },
    why,
  }
}
