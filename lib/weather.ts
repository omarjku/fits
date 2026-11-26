// Postcode -> forecast for the hours you are outside + how that compares with
// the past week and with the same week in previous years. Open-Meteo, no API key.
import { HttpError } from './http'

export type Place = { postcode: string; country: string; name: string; lat: number; lon: number }

// Seeded so the demo postcode works even if the lookup service is down.
const places = new Map<string, Place>([
  ['AT-4020', { postcode: '4020', country: 'AT', name: 'Linz', lat: 48.3064, lon: 14.2861 }],
])

async function getJson(url: string) {
  const r = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  if (!r.ok) throw new HttpError(r.status === 404 ? 404 : 502, `${new URL(url).host} answered ${r.status}`)
  return r.json()
}

export async function geocode(postcode: string, country = 'AT'): Promise<Place> {
  postcode = postcode.trim()
  country = country.trim().toUpperCase()
  if (!/^[A-Za-z0-9 -]{2,10}$/.test(postcode) || !/^[A-Z]{2}$/.test(country))
    throw new HttpError(400, 'Give a postcode (e.g. 4020) and a 2-letter country code (e.g. AT).')
  const key = `${country}-${postcode}`
  const known = places.get(key)
  if (known) return known
  const d = await getJson(`https://api.zippopotam.us/${country}/${encodeURIComponent(postcode)}`).catch((e) => {
    throw e.status === 404 ? new HttpError(404, `Postcode ${postcode} not found in ${country}.`) : e
  })
  const p = d.places[0]
  const place = { postcode, country, name: p['place name'], lat: Number(p.latitude), lon: Number(p.longitude) }
  places.set(key, place)
  return place
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

const HOURLY = 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,precipitation_probability,snowfall,wind_speed_10m,wind_gusts_10m,weather_code'
const DAILY = 'apparent_temperature_mean,apparent_temperature_min,snowfall_sum'
const YEARS = 5

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
  return {
    years: YEARS,
    feelsLike: r1(avg(idx.map((i) => d.daily.apparent_temperature_mean[i]))),
    feelsLikeMin: r1(avg(idx.map((i) => d.daily.apparent_temperature_min[i]))),
    snowDayShare: r1(idx.filter((i) => d.daily.snowfall_sum[i] > 0).length / idx.length),
  }
}

export async function getWeather(postcode: string, country = 'AT', hoursOutside = 3) {
  const hours = Math.min(48, Math.max(1, Math.round(hoursOutside) || 3))
  const place = await geocode(postcode, country)
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

  const today = h.time[i].slice(0, 10)
  return {
    place,
    timezone: f.timezone as string,
    now: {
      time: h.time[i] as string,
      temp: h.temperature_2m[i] as number,
      feelsLike: h.apparent_temperature[i] as number,
      wind: h.wind_speed_10m[i] as number,
      humidity: h.relative_humidity_2m[i] as number,
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
    // Today hour by hour, for a chart.
    today: (h.time as string[]).flatMap((t, k) => (t.startsWith(today)
      ? [{ time: t, temp: h.temperature_2m[k], feelsLike: h.apparent_temperature[k], precipProb: h.precipitation_probability[k] }] : [])),
  }
}

export type Weather = Awaited<ReturnType<typeof getWeather>>
