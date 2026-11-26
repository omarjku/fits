import type { Historical } from '../types'
import Mascot from './Mascot'

const INK = '#2B3470'
const line = { fill: 'none', stroke: INK, strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round', vectorEffect: 'non-scaling-stroke' } as const

export default function HistoricalCard({ data }: { data: Historical | null }) {
  if (!data) {
    return <section className="card p-5" aria-busy="true"><Mascot size={56} mood="shiver" /><p className="mt-2">Checking the last ten winters</p></section>
  }
  return (
    <section className="p-1" aria-labelledby="hist-h">
      <h2 id="hist-h" className="h-title">Usually at this time in {data.place}</h2>
      <div className="relative mt-3 flex items-center gap-5 px-6 py-6">
        {/* wobbly hand-drawn card outline */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 400 170" preserveAspectRatio="none" aria-hidden="true">
          <path d="M34 30 C 90 14, 200 10, 300 12 C 360 14, 392 26, 391 62 C 390 100, 394 128, 384 144 C 370 162, 300 160, 200 158 C 130 158, 60 166, 28 148 C 8 134, 10 90, 12 56 C 12 44, 18 38, 26 34 L 22 40"
            {...line} fill="#fff" />
        </svg>
        <figure className="relative h-[116px] w-[116px] shrink-0" aria-label={`Average temperature over the past 10 years: ${data.avgTemp} degrees`}>
          <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <path d="M50 14 C 82 4, 112 28, 111 62 C 110 96, 84 115, 56 112 C 26 109, 8 88, 10 58 C 12 30, 34 12, 64 11 C 74 10, 82 13, 88 18 M62 8 C 70 4, 82 6, 90 12" {...line} />
          </svg>
          <figcaption className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="num text-3xl leading-none">{data.avgTemp}°</span>
            <span className="caption">10-year avg</span>
          </figcaption>
        </figure>
        <dl className="relative flex-1 space-y-2">
          <Stat label="Avg low / high" value={`${data.avgLow}° / ${data.avgHigh}°C`} d="M2 5 C 40 2, 90 7, 150 3 S 230 5 298 3" />
          <Stat label="Wind" value={`${data.windKmh} km/h`} d="M2 3 C 50 6, 110 2, 170 5 S 250 3 298 6" />
          <Stat label="Precipitation" value={`${data.precipMm} mm/day`} d="M3 4 C 60 2, 120 6, 180 3 S 260 6 297 3" />
        </dl>
      </div>
    </section>
  )
}

function Stat({ label, value, d }: { label: string; value: string; d: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 px-1">
        <dt className="caption">{label}</dt>
        <dd className="num text-sm">{value}</dd>
      </div>
      <svg viewBox="0 0 300 8" preserveAspectRatio="none" className="block h-2 w-full" aria-hidden="true"><path d={d} {...line} /></svg>
    </div>
  )
}
