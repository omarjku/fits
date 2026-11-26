// All data lives here. Replace these async functions with real backend calls later.
import type {
  Activity, ClothingItem, Historical, NewClothing, OutfitItem, Preferences,
  Recommendation, Weather,
} from './types'

const wait = (ms = 450) => new Promise((r) => setTimeout(r, ms + Math.random() * 250))

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
  await wait(250)
  return [...loadWardrobe()]
}

const EMOJI: Record<string, string> = { base: '👕', mid: '🧶', outer: '🧥', accessory: '🧣' }

export async function addClothing(input: NewClothing): Promise<ClothingItem> {
  await wait(250)
  const item: ClothingItem = {
    id: 'w' + Date.now(),
    name: input.name.trim(),
    layer: input.layer,
    warmth: input.warmth,
    waterRepellent: input.waterRepellent,
    emoji: input.emoji || EMOJI[input.layer],
  }
  wardrobe = [...loadWardrobe(), item]
  saveWardrobe()
  return item
}

export async function setWaterRepellent(id: string, value: boolean): Promise<void> {
  wardrobe = loadWardrobe().map((i) => (i.id === id ? { ...i, waterRepellent: value } : i))
  saveWardrobe()
}

// ---------- Mock climate data ----------

interface Climate {
  place: string
  base: number // current temperature
  swing: number // swing over next 12h
  wind: number
  humidity: number
  rain: number // mm/h now
  snow: number // cm/h now
  hist: Omit<Historical, 'place'>
}

const CLIMATES: Record<string, Climate> = {
  linz: { place: 'Linz', base: 1, swing: 3, wind: 14, humidity: 88, rain: 0.1, snow: 0.6,
    hist: { avgTemp: 5, avgLow: 1, avgHigh: 8, windKmh: 12, precipMm: 1.8 } },
  wales: { place: 'Wales', base: 8, swing: 2, wind: 28, humidity: 91, rain: 2.4, snow: 0,
    hist: { avgTemp: 8, avgLow: 5, avgHigh: 11, windKmh: 24, precipMm: 4.1 } },
  oslo: { place: 'Oslo', base: -6, swing: 3, wind: 10, humidity: 80, rain: 0, snow: 0.8,
    hist: { avgTemp: -1, avgLow: -5, avgHigh: 2, windKmh: 11, precipMm: 1.6 } },
  london: { place: 'London', base: 9, swing: 2, wind: 18, humidity: 84, rain: 1.2, snow: 0,
    hist: { avgTemp: 8, avgLow: 5, avgHigh: 11, windKmh: 16, precipMm: 1.7 } },
  tenerife: { place: 'Tenerife', base: 21, swing: 3, wind: 16, humidity: 62, rain: 0, snow: 0,
    hist: { avgTemp: 20, avgLow: 17, avgHigh: 23, windKmh: 15, precipMm: 0.5 } },
}

function climateFor(name: string): Climate {
  const key = name.trim().toLowerCase()
  if (CLIMATES[key]) return CLIMATES[key]
  // Deterministic pseudo-weather for any other destination
  let h = 0
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) % 997
  const base = 2 + (h % 12)
  const wet = h % 3 === 0
  return {
    place: name.trim().replace(/\b\w/g, (c) => c.toUpperCase()),
    base, swing: 3, wind: 8 + (h % 20), humidity: 60 + (h % 35),
    rain: wet ? 1.5 : 0, snow: base < 1 && wet ? 0.5 : 0,
    hist: { avgTemp: base - 1, avgLow: base - 4, avgHigh: base + 3, windKmh: 10 + (h % 14), precipMm: wet ? 3.2 : 1.2 },
  }
}

function buildWeather(c: Climate): Weather {
  const startHour = new Date().getHours()
  const hourly = Array.from({ length: 13 }, (_, i) => {
    const h = (startHour + i) % 24
    const t = c.base + c.swing * Math.sin((i / 12) * Math.PI - 0.3) + Math.sin(i * 1.7) * 0.4
    return { hour: `${String(h).padStart(2, '0')}:00`, temp: Math.round(t * 10) / 10 }
  })
  const t = c.base
  // wind chill (valid for t <= 10C), otherwise a mild humidity adjustment
  let feels = t
  if (t <= 10 && c.wind > 4.8) {
    feels = 13.12 + 0.6215 * t - 11.37 * Math.pow(c.wind, 0.16) + 0.3965 * t * Math.pow(c.wind, 0.16)
  } else if (t > 20) {
    feels = t + (c.humidity - 50) / 40
  }
  return {
    place: c.place, hourly, feelsLike: Math.round(feels * 10) / 10,
    windKmh: c.wind, humidity: c.humidity, rainMm: c.rain, snowCm: c.snow,
  }
}

export function getHomePlace(prefs: Preferences): string {
  return prefs.postcode.trim() === '4020' ? 'Linz' : prefs.postcode.trim() || 'Linz'
}

export async function getWeather(place: string): Promise<Weather> {
  await wait(300)
  return buildWeather(climateFor(place))
}

export async function getHistorical(place: string): Promise<Historical> {
  await wait(300)
  const c = climateFor(place)
  return { place: c.place, ...c.hist }
}

// ---------- Recommendation engine ----------

const ACTIVITY_OFFSET: Record<Activity, number> = {
  skiing: 5, hiking: 6, walking: 2, commuting: 0, 'sitting outside': -5,
}

export const DEFAULT_PREFS: Preferences = {
  postcode: '4020', country: 'Austria', activity: 'walking', warmth: 50, hours: 3,
}

function pickClosest(list: ClothingItem[], need: number): ClothingItem | undefined {
  return [...list].sort((a, b) => Math.abs(a.warmth - need) - Math.abs(b.warmth - need))[0]
}

function recommend(prefs: Preferences, weather: Weather, items: ClothingItem[]): { out: OutfitItem[]; summary: string } {
  const wet = weather.rainMm >= 0.5 || weather.snowCm >= 0.3
  const snowing = weather.snowCm >= 0.3

  const eff0 = weather.feelsLike
  let eff = eff0 + ACTIVITY_OFFSET[prefs.activity]
  eff += ((prefs.warmth - 50) / 50) * 4 // runs hot -> feels warmer
  eff -= Math.max(0, prefs.hours - 4) * 0.5 // long exposure -> colder

  const need = Math.max(0, Math.min(12, (16 - eff) / 2.2))
  const byLayer = (l: ClothingItem['layer']) => items.filter((i) => i.layer === l)
  const out: OutfitItem[] = []
  let total = 0

  const base = pickClosest(byLayer('base'), need >= 3 ? 2 : 1)
  if (base) {
    total += base.warmth
    out.push({ item: base, reason: need >= 3 ? 'Wicking warmth against your skin' : 'Light and breathable, it is mild enough' })
  }
  if (need >= 5) {
    const mid = pickClosest(byLayer('mid'), Math.min(4, need - total - 1))
    if (mid) {
      total += mid.warmth
      out.push({ item: mid, reason: prefs.warmth < 40 ? 'Extra insulation since you run cold' : `Insulating layer for ${prefs.hours}h outside` })
    }
  }
  if (need >= 3 || wet) {
    let pool = byLayer('outer')
    if (wet) {
      const dry = pool.filter((i) => i.waterRepellent)
      if (dry.length) pool = dry
    }
    const outer = pickClosest(pool, Math.max(1, need - total))
    if (outer) {
      total += outer.warmth
      const why = outer.waterRepellent && wet
        ? `Water-repellent, it's ${snowing ? 'snowing' : 'raining'}`
        : weather.windKmh > 20 ? `Blocks the ${Math.round(weather.windKmh)} km/h wind` : 'Seals in warmth against the cold'
      out.push({ item: outer, reason: why })
    }
  }
  const acc = byLayer('accessory')
  const find = (re: RegExp) => acc.find((i) => re.test(i.name.toLowerCase()))
  const hat = find(/beanie|hat|cap/), scarf = find(/scarf/), gloves = find(/glove|mitt/)
  if (hat && eff < 6) out.push({ item: hat, reason: 'Most heat escapes through your head' })
  if (scarf && eff < 3) out.push({ item: scarf, reason: weather.windKmh > 15 ? 'Wind makes your neck feel colder' : 'Keeps your neck cozy' })
  if (gloves && eff < 4) out.push({ item: gloves, reason: gloves.waterRepellent && wet ? 'Keeps hands dry and warm' : 'Fingers get cold first' })
  if (eff < 0) {
    acc.filter((i) => ![hat, scarf, gloves].includes(i)).slice(0, 1)
      .forEach((i) => out.push({ item: i, reason: 'Bonus warmth for the deep chill' }))
  }

  const tweaks: string[] = []
  if (prefs.warmth < 40) tweaks.push('you run cold')
  if (prefs.warmth > 60) tweaks.push('you run hot')
  tweaks.push(`${prefs.activity} for ${prefs.hours}h`)
  const summary = `${weather.place} feels like ${Math.round(weather.feelsLike)}°C ${
    wet ? (snowing ? 'with snow around' : 'with rain around') : 'and looks dry'
  }. Since ${tweaks.join(' and ')}, you need roughly ${Math.round(need)} warmth points in your layers, and these pieces add up to ${total}.`
  return { out, summary }
}

export async function getRecommendation(prefs: Preferences, destination?: string): Promise<Recommendation> {
  await wait(1400)
  const place = destination?.trim() || getHomePlace(prefs)
  const c = climateFor(place)
  const weather = buildWeather(c)
  const { out, summary } = recommend(prefs, weather, loadWardrobe())
  return { place: c.place, weather, historical: { place: c.place, ...c.hist }, items: out, summary }
}
