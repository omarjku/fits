import { useState } from 'react'
import type { Recommendation } from '../types'
import { OutfitList } from './OutfitCard'
import Mascot from './Mascot'

interface Props {
  home: Recommendation | null
  trip: Recommendation | null
  loading: boolean
  onCompare: (place: string) => void
}

export default function CompareBar({ home, trip, loading, onCompare }: Props) {
  const [place, setPlace] = useState('')
  const homeIds = new Set(home?.items.map((i) => i.item.id))
  const tripIds = new Set(trip?.items.map((i) => i.item.id))
  const extraTrip = trip ? trip.items.filter((i) => !homeIds.has(i.item.id)).map((i) => i.item.id) : []
  const extraHome = home ? home.items.filter((i) => !tripIds.has(i.item.id)).map((i) => i.item.id) : []

  return (
    <section className="card p-5" aria-labelledby="cmp-h">
      <h2 id="cmp-h" className="h-title">Compare with a trip</h2>
      <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (place.trim()) onCompare(place) }}>
        <label className="sr-only" htmlFor="trip">Trip destination</label>
        <input id="trip" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Destination, e.g. Wales"
          className="field min-w-0 flex-1 !rounded-full" />
        <button className="btn px-5" type="submit" disabled={loading || !place.trim()}>Compare</button>
      </form>

      {loading && <div className="mt-4 flex items-center gap-3" role="status"><Mascot size={48} mood="shiver" /><p>Packing a suitcase</p></div>}

      {!loading && trip && home && (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <h3 className="h-sub">Home</h3>
              <p className="caption mb-2">{home.place}, feels {Math.round(home.weather.feelsLike)}°C</p>
              <OutfitList items={home.items} highlight={extraHome} />
            </div>
            <div>
              <h3 className="h-sub">{trip.place}</h3>
              <p className="caption mb-2">feels {Math.round(trip.weather.feelsLike)}°C, rain {trip.weather.rainMm.toFixed(1)} mm/h</p>
              <OutfitList items={trip.items} highlight={extraTrip} />
            </div>
          </div>
          <p className="caption mt-3">
            Highlighted pieces are the extra layers one side needs.
            {extraTrip.length === 0 && extraHome.length === 0 && ' The same outfit works for both.'}
          </p>
        </div>
      )}
    </section>
  )
}
