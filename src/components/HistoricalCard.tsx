import type { Historical } from '../types'
import Mascot from './Mascot'
import SnowflakeIcon from './SnowflakeIcon'

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

function Glyph({ children }: { children: React.ReactNode }) {
  return <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-navy" aria-hidden="true" {...stroke}>{children}</svg>
}

export default function HistoricalCard({ data }: { data: Historical | null }) {
  if (!data) {
    return <section className="card p-6" aria-busy="true"><Mascot size={56} mood="shiver" /><p className="mt-2">Checking the last ten winters</p></section>
  }
  const span = Math.max(data.avgHigh - data.avgLow, 1)
  const pos = Math.min(100, Math.max(0, ((data.avgTemp - data.avgLow) / span) * 100))
  return (
    <section className="card p-6" aria-labelledby="hist-h">
      <h2 id="hist-h" className="h-title">Usually at this time in {data.place}</h2>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <p className="num text-6xl leading-none" aria-label={`Average temperature over the past 10 years: ${data.avgTemp} degrees`}>{data.avgTemp}°</p>
          <p className="caption mt-2">Average for today, last 10 years</p>
        </div>
        <SnowflakeIcon size={64} color="#2B3470" className="shrink-0" />
      </div>

      <div className="mt-5">
        <div className="flex justify-between text-sm">
          <span className="num">{data.avgLow}°</span>
          <span className="num">{data.avgHigh}°</span>
        </div>
        <div className="relative mt-1 h-2 rounded-full bg-ice" role="img" aria-label={`Typical range ${data.avgLow} to ${data.avgHigh} degrees`}>
          <div className="absolute inset-y-0 left-0 right-0 rounded-full" style={{ background: 'linear-gradient(90deg, #CFE0EE, #FFD87A)' }} />
          <span className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-navy shadow" style={{ left: `${pos}%` }} />
        </div>
        <div className="mt-1 flex justify-between"><span className="caption">Avg low</span><span className="caption">Avg high</span></div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3">
        <div className="tile flex items-center gap-3 p-3">
          <Glyph><path d="M3 9h10a2.5 2.5 0 1 0-2.5-2.5M3 14h14a2.5 2.5 0 1 1-2.5 2.5M3 19h7" /></Glyph>
          <div><dt className="caption">Wind</dt><dd className="num">{data.windKmh} km/h</dd></div>
        </div>
        <div className="tile flex items-center gap-3 p-3">
          <Glyph><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" /></Glyph>
          <div><dt className="caption">Precipitation</dt><dd className="num">{data.precipMm} mm/day</dd></div>
        </div>
      </dl>
    </section>
  )
}
