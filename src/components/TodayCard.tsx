import type { Weather } from '../types'
import Mascot from './Mascot'
import SnowflakeIcon from './SnowflakeIcon'
import Icon from './Icon'

// Smooth path via Catmull-Rom -> cubic bezier
function smooth(pts: [number, number][]): string {
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`
  }
  return d
}

export default function TodayCard({ weather }: { weather: Weather | null }) {
  if (!weather) {
    return <section className="card p-5" aria-busy="true"><Mascot size={56} mood="shiver" /><p className="mt-2">Checking the sky</p></section>
  }
  const W = 320, H = 130, padX = 14, padT = 24, padB = 22
  const temps = weather.hourly.map((p) => p.temp)
  const min = Math.min(...temps) - 1, max = Math.max(...temps) + 1
  const x = (i: number) => padX + (i / (temps.length - 1)) * (W - padX * 2)
  const y = (t: number) => padT + (1 - (t - min) / (max - min)) * (H - padT - padB)
  const pts = temps.map((t, i) => [x(i), y(t)] as [number, number])
  const line = smooth(pts)
  const area = `${line} L${x(temps.length - 1)},${H - padB} L${x(0)},${H - padB} Z`
  const hi = temps.indexOf(Math.max(...temps)), lo = temps.indexOf(Math.min(...temps))
  const summary = `Temperature over the next 12 hours, from ${temps[0]} to ${temps[temps.length - 1]} degrees, high ${Math.max(...temps)}, low ${Math.min(...temps)}.`

  const t = Math.round(weather.feelsLike)
  const sky = weather.snowCm > 0.1 ? 'Snow' : weather.rainMm > 0.1 ? 'Rain' : 'Dry'
  const advice = t <= -5 ? 'bundle up' : t <= 2 ? 'layer up' : t <= 10 ? 'bring a warm jacket' : t <= 18 ? 'a light layer is enough' : 'dress light'
  const headline = `${sky} and ${t}\u00B0 in ${weather.place.split(',')[0]}, ${advice}`
  return (
    <section className="card p-5" aria-labelledby="today-h">
      <h2 id="today-h" className="h-title">{headline}</h2>
      <p className="caption mt-1">Feels like {t}° with {Math.round(weather.windKmh)} km/h wind and {weather.humidity}% humidity</p>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label={summary}>
        <defs>
          <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#B9D6EC" stopOpacity=".8" /><stop offset="1" stopColor="#B9D6EC" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#tg)" />
        <path d={line} fill="none" stroke="#2B3470" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {[hi, lo].map((i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(temps[i])} r="4.5" fill="#fff" stroke="#2B3470" strokeWidth="2.5" />
            <text x={x(i)} y={y(temps[i]) + (i === hi ? -9 : 17)} textAnchor="middle" fontSize="12" fontWeight="600" fill="#2B3470">{temps[i]}°</text>
          </g>
        ))}
        {[0, 3, 6, 9, 12].map((i) => (
          <text key={i} x={x(i)} y={H - 5} textAnchor="middle" fontSize="10" fontWeight="500" fill="#4d5483">{weather.hourly[i].hour}</text>
        ))}
      </svg>

      <ul className="mt-3 flex gap-4 font-medium text-navy">
        <li className="flex items-center gap-1.5"><Icon name="drop" className="h-5 w-5" /> Rain {weather.rainMm.toFixed(1)} mm/h</li>
        <li className="flex items-center gap-1.5"><SnowflakeIcon className="h-5 w-5 text-navy" /> Snow {weather.snowCm.toFixed(1)} cm/h</li>
      </ul>
    </section>
  )
}
