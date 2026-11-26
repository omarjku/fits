import { useCallback, useEffect, useState } from 'react'
import type { ClothingItem, Historical, NewClothing, Preferences, Recommendation, Weather } from './types'
import {
  DEFAULT_PREFS, addClothing, getHistorical, getRecommendation,
  getWardrobe, getWeather, setWaterRepellent,
} from './api'
import Onboarding from './components/Onboarding'
import Mascot from './components/Mascot'
import Icon from './components/Icon'
import Doodles from './components/Doodles'
import HistoricalCard from './components/HistoricalCard'
import TodayCard from './components/TodayCard'
import WardrobeCard from './components/WardrobeCard'
import OutfitSection from './components/OutfitCard'
import CompareBar from './components/CompareBar'

const PREFS_KEY = 'frosty.prefs.v1'

function loadPrefs(): Preferences | null {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : null
  } catch { return null }
}

export default function App() {
  const [prefs, setPrefs] = useState<Preferences | null>(loadPrefs)
  const [onboarding, setOnboarding] = useState(() => loadPrefs() === null)

  const [hist, setHist] = useState<Historical | null>(null)
  const [weather, setWeather] = useState<Weather | null>(null)
  const [wardrobe, setWardrobe] = useState<ClothingItem[] | null>(null)
  const [rec, setRec] = useState<Recommendation | null>(null)
  const [recLoading, setRecLoading] = useState(false)
  const [trip, setTrip] = useState<Recommendation | null>(null)
  const [tripLoading, setTripLoading] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [outfitError, setOutfitError] = useState<string | null>(null)

  const effective = prefs ?? DEFAULT_PREFS
  const message = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Please try again.')

  const save = (p: Preferences) => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)) } catch { /* ignore */ }
    setPrefs(p); setOnboarding(false); setRec(null); setTrip(null)
  }
  const skip = () => save(prefs ?? DEFAULT_PREFS)

  useEffect(() => {
    if (onboarding) return
    setHist(null); setWeather(null); setWeatherError(null)
    getHistorical(effective).then(setHist).catch((e) => setWeatherError(message(e)))
    getWeather(effective).then(setWeather).catch((e) => setWeatherError(message(e)))
  }, [effective.postcode, effective.country, effective.hours, onboarding])

  useEffect(() => { getWardrobe().then(setWardrobe) }, [])

  const ask = useCallback(async () => {
    setRecLoading(true); setOutfitError(null)
    try { setRec(await getRecommendation(effective)) } catch (e) { setOutfitError(message(e)) } finally { setRecLoading(false) }
  }, [effective])

  const compare = async (place: string) => {
    setTripLoading(true); setOutfitError(null)
    try {
      const [h, t] = await Promise.all([getRecommendation(effective), getRecommendation(effective, place)])
      setRec(h); setTrip(t)
    } catch (e) { setOutfitError(message(e)) } finally { setTripLoading(false) }
  }

  const add = async (i: NewClothing) => { await addClothing(i); setWardrobe(await getWardrobe()) }
  const toggle = async (id: string, v: boolean) => {
    setWardrobe((w) => w && w.map((i) => (i.id === id ? { ...i, waterRepellent: v } : i)))
    await setWaterRepellent(id, v)
  }

  if (onboarding) return <Onboarding initial={effective} onDone={save} onSkip={skip} />

  return (
    <div className="relative min-h-dvh">
      <Doodles />
      <div className="relative z-10 mx-auto max-w-md space-y-6 px-4 pb-16 pt-4">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mascot size={52} />
            <span className="font-display text-2xl font-semibold text-navy">Frosty</span>
          </div>
          <button onClick={() => setOnboarding(true)} aria-label="Open settings"
            className="card flex h-11 w-11 items-center justify-center !rounded-full text-navy">
            <Icon name="sliders" />
          </button>
        </header>

        {weatherError
          ? <section className="card p-5" role="alert"><p className="font-medium text-navy">{weatherError}</p></section>
          : <><HistoricalCard data={hist} /><TodayCard weather={weather} /></>}
        <WardrobeCard items={wardrobe} onAdd={add} onToggleWater={toggle} />
        <OutfitSection loading={recLoading} rec={rec} onAsk={ask} />
        {outfitError && <section className="card p-5" role="alert"><p className="font-medium text-navy">{outfitError}</p></section>}
        <CompareBar home={rec} trip={trip} loading={tripLoading} onCompare={compare} />
      </div>
    </div>
  )
}
