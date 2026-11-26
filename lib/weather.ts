// Postcode or place name -> forecast for the hours you are outside + how that compares with
// the past week and with the same week in previous years. Open-Meteo, no API key.
import { HttpError } from './http'

export type Place = { name: string; lat: number; lon: number; postcode?: string; country?: string }
export type Where = { postcode?: string; country?: string; place?: string }

// Seeded so the demo locations work even if a lookup service is down or ambiguous
// (searching "Wales" by name finds a village in Yorkshire, not the country).
const places = new Map<string, Place>([
  ['AT-4020', { postcode: '4020', country: 'AT', name: 'Linz', lat: 48.3064, lon: 14.2861 }],
  ['linz', { name: 'Linz', lat: 48.3064, lon: 14.2861 }],
  ['wales', { name: 'Wales', lat: 52.13, lon: -3.78 }],
])

async function getJson(url: string) {
  const r = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  if (!r.ok) throw new HttpError(r.status === 404 ? 404 : 502, `${new URL(url).host} answered ${r.status}`)
  return r.json()
}

/** "AT", "at" or "Austria" -> "AT". */
function countryCode(country: string) {
  const c = country.trim()
  if (/^[A-Za-z]{2}$/.test(c)) return c.toUpperCase()
  const names = new Intl.DisplayNames(['en'], { type: 'region' })
  for (let a = 65; a <= 90; a++) for (let b = 65; b <= 90; b++) {
    const code = String.fromCharCode(a, b)
    if (names.of(code)?.toLowerCase() === c.toLowerCase()) return code
  }
  throw new HttpError(400, `Unknown country "${c.slice(0, 40)}". Use a name like Austria or a code like AT.`)
}

export async function geocode({ postcode = '', country = 'AT', place = '' }: Where): Promise<Place> {
  postcode = postcode.trim()
  place = place.trim()

  if (place) {
    if (!/^[\p{L}\p{N} .,'-]{2,60}$/u.test(place)) throw new HttpError(400, 'Give a place name, e.g. Wales.')
    const key = place.toLowerCase()
    const known = places.get(key)
    if (known) return known
    const d = await getJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=en`)
    const r = d.results?.[0]
    if (!r) throw new HttpError(404, `Could not find a place called ${place}.`)
    const found = { name: r.name as string, lat: r.latitude as number, lon: r.longitude as number }
    places.set(key, found)
    return found
  }

  if (!/^[A-Za-z0-9 -]{2,10}$/.test(postcode)) throw new HttpError(400, 'Give a postcode, e.g. 4020.')
  const cc = countryCode(country)
  const key = `${cc}-${postcode}`
  const known = places.get(key)
  if (known) return known
  const d = await getJson(`https://api.zippopotam.us/${cc}/${encodeURIComponent(postcode)}`).catch((e) => {
    throw e.status === 404 ? new HttpError(404, `Postcode ${postcode} not found in ${cc}.`) : e
  })
  const p = d.places[0]
  const found = { postcode, country: cc, name: p['place name'] as string, lat: Number(p.latitude), lon: Number(p.longitude) }
  places.set(key, found)
  return found
}

// ponytail: WMO codes grouped by range; the highest code in the window is treated as the worst.
function condition(code: number) {
  if (code >= 95) return 'thunderstorm'
  if (code >= 85) return 'snow showers'
  if (code >= 80) return 'rain showers'
  if (code >= 71) return 'snow'
  if (code >= 61) return 'rain'
  if (code >= 51) return 'drizzle'
  if (code >= 45) return 'fog'
  if (code >= 1) return 'cloudy'
  return 'clear'
}

const avg = (a: number[]) => a.reduce((t, n) => t + n, 0) / a.length
const sum = (a: number[]) => a.reduce((t, n) => t + n, 0)
const r1 = (n: number) => Math.round(n * 10) / 10
const day = (d: Date) => d.toISOString().slice(0, 10)

const HOURLY = 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,precipitation_probability,rain,showers,snowfall,wind_speed_10m,wind_gusts_10m,weather_code'
const DAILY = 'apparent_temperature_mean,apparent_temperature_min,temperature_2m_mean,temperature_2m_min,temperature_2m_max,wind_speed_10m_max,precipitation_sum,snowfall_sum'
const YEARS = 10

/** Same week (today +/- 3 days) in each of the previous YEARS years. */
async function typicalForThisWeek(place: Place, today: Date) {
  const wanted = new Set<string>()
  for (let y = 1; y <= YEARS; y++) for (let d = -3; d <= 3; d++) {
    const t = new Date(today)
    t.setUTCFullYear(t.getUTCFullYear() - y)
    t.setUTCDate(t.getUTCDate() + d)
    wanted.add(day(t))
  }
  const dates = [...wanted].sort()
  const d = await getJson(`https://archive-api.open-meteo.com/v1/archive?latitude=${place.lat}&longitude=${place.lon}&start_date=${dates[0]}&end_date=${dates.at(-1)}&daily=${DAILY}&timezone=auto`)
  const idx = (d.daily.time as string[]).flatMap((t, i) => (wanted.has(t) && d.daily.apparent_temperature_mean[i] !== null ? [i] : []))
  if (!idx.length) return null
  const mean = (key: string) => r1(avg(idx.map((i) => d.daily[key][i] as number)))
  return {
    years: YEARS,
    feelsLike: mean('apparent_temperature_mean'),
    feelsLikeMin: mean('apparent_temperature_min'),
    temp: mean('temperature_2m_mean'),
    tempLow: mean('temperature_2m_min'),
    tempHigh: mean('temperature_2m_max'),
    windMax: mean('wind_speed_10m_max'),
    precipMmPerDay: mean('precipitation_sum'),
    snowDayShare: r1(idx.filter((i) => d.daily.snowfall_sum[i] > 0).length / idx.length),
  }
}

export async function getWeather(where: Where, hoursOutside = 3) {
  const hours = Math.min(48, Math.max(1, Math.round(hoursOutside) || 3))
  const place = await geocode(where)
  const f = await getJson(`https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}&hourly=${HOURLY}&past_days=7&forecast_days=3&timezone=auto`)
  const h = f.hourly

  // Open-Meteo returns local wall-clock times; shift "now" by the UTC offset to find the current hour.
  const localNow = new Date(Date.now() + f.utc_offset_seconds * 1000)
  const i = (h.time as string[]).indexOf(localNow.toISOString().slice(0, 13) + ':00')
  if (i < 0) throw new HttpError(502, 'Forecast does not cover the current hour.')
  const w = (key: string): number[] => h[key].slice(i, i + hours + 1)

  const window = {
    hours,
    from: h.time[i] as string,
    to: h.time[Math.min(i + hours, h.time.length - 1)] as string,
    tempMin: Math.min(...w('temperature_2m')),
    tempMax: Math.max(...w('temperature_2m')),
    feelsLikeMin: Math.min(...w('apparent_temperature')),
    feelsLikeAvg: r1(avg(w('apparent_temperature'))),
    windMax: Math.max(...w('wind_speed_10m')),
    gustMax: Math.max(...w('wind_gusts_10m')),
    precipMm: r1(sum(w('precipitation'))),
    precipProbMax: Math.max(...w('precipitation_probability')),
    snowCm: r1(sum(w('snowfall'))),
    humidityAvg: Math.round(avg(w('relative_humidity_2m'))),
    condition: condition(Math.max(...w('weather_code'))),
  }

  // What you have been dressing for: waking hours (07-22) of the past 7 days.
  const lastWeek = (h.apparent_temperature as number[]).slice(Math.max(0, i - 168), i)
    .filter((_, k) => { const hr = Number(h.time[Math.max(0, i - 168) + k].slice(11, 13)); return hr >= 7 && hr <= 22 })
  const lastWeekFeelsLike = r1(avg(lastWeek))
  const typical = await typicalForThisWeek(place, localNow).catch(() => null)

  const vsLastWeek = r1(window.feelsLikeAvg - lastWeekFeelsLike)
  const vsTypical = typical ? r1(window.feelsLikeAvg - typical.feelsLike) : null
  const say = (delta: number) => (Math.abs(delta) < 1.5 ? 'about the same as' : `${Math.abs(Math.round(delta))}° ${delta < 0 ? 'colder' : 'warmer'} than`)

  return {
    place,
    timezone: f.timezone as string,
    now: {
      time: h.time[i] as string,
      temp: h.temperature_2m[i] as number,
      feelsLike: h.apparent_temperature[i] as number,
      wind: h.wind_speed_10m[i] as number,
      humidity: h.relative_humidity_2m[i] as number,
      rainMm: r1(h.rain[i] + h.showers[i]), // this hour, liquid only
      snowCm: h.snowfall[i] as number, // this hour
      condition: condition(h.weather_code[i]),
    },
    window,
    history: {
      lastWeekFeelsLike,
      vsLastWeek,
      typical,
      vsTypical,
      summary: `Feels ${say(vsLastWeek)} the past week in ${place.name}` +
        (typical && vsTypical !== null ? `, and ${say(vsTypical)} a typical late-${localNow.toLocaleString('en', { month: 'long', timeZone: 'UTC' })} day here (${YEARS}-year average).` : '.'),
    },
    // Now and the next 12 hours, for a chart.
    hourly: (h.time as string[]).slice(i, i + 13).map((t, k) => ({
      time: t, temp: h.temperature_2m[i + k] as number, feelsLike: h.apparent_temperature[i + k] as number, precipProb: h.precipitation_probability[i + k] as number,
    })),
  }
}

export type Weather = Awaited<ReturnType<typeof getWeather>>
