import { useState } from 'react'
import type { Activity, Preferences } from '../types'
import Mascot from './Mascot'
import { TinyFlake } from './Doodles'
import Icon from './Icon'

const ACTIVITIES: { id: Activity }[] = [
  { id: 'walking' }, { id: 'commuting' }, { id: 'hiking' }, { id: 'skiing' }, { id: 'sitting outside' },
]

interface Props {
  initial: Preferences
  onDone: (p: Preferences) => void
  onSkip: () => void
}

const STEPS = 3

export default function Onboarding({ initial, onDone, onSkip }: Props) {
  const [step, setStep] = useState(0)
  const [p, setP] = useState<Preferences>(initial)
  const set = <K extends keyof Preferences>(k: K, v: Preferences[K]) => setP((o) => ({ ...o, [k]: v }))

  const next = () => (step < STEPS - 1 ? setStep(step + 1) : onDone(p))
  const back = () => setStep(Math.max(0, step - 1))

  // swipe support
  const [startX, setStartX] = useState<number | null>(null)
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX === null) return
    const dx = e.changedTouches[0].clientX - startX
    if (dx < -50) next()
    else if (dx > 50) back()
    setStartX(null)
  }

  const titles = ['Where are you?', 'What are you up to?', 'How do you feel the cold?']

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-8 pt-5"
      onTouchStart={(e) => setStartX(e.touches[0].clientX)} onTouchEnd={onTouchEnd}>
      <TinyFlake className="absolute right-6 top-20 h-7 w-7 opacity-60" />
      <TinyFlake className="absolute left-4 top-1/2 h-5 w-5 opacity-50" />

      <div className="flex items-center gap-3">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-ice" role="progressbar"
          aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={step + 1} aria-label={`Step ${step + 1} of ${STEPS}`}>
          <div className="h-full rounded-full bg-navy" style={{ width: `${((step + 1) / STEPS) * 100}%` }} />
        </div>
        <button className="btn-ghost" onClick={onSkip}>Skip</button>
      </div>

      <div className="mt-6 flex justify-center"><Mascot size={110} /></div>

      <div className="card mt-4 flex-1 p-6" key={step} aria-live="polite">
        <h1 className="h-hero">{titles[step]}</h1>

        {step === 0 && (
          <div className="mt-5 space-y-4">
            <p>Frosty looks up the weather for your spot.</p>
            <label className="block font-medium text-navy" htmlFor="postcode">Postcode
              <input id="postcode" inputMode="numeric" value={p.postcode} onChange={(e) => set('postcode', e.target.value)}
                className="field mt-1 w-full" />
            </label>
            <label className="block font-medium text-navy" htmlFor="country">Country
              <input id="country" value={p.country} onChange={(e) => set('country', e.target.value)}
                className="field mt-1 w-full" />
            </label>
          </div>
        )}

        {step === 1 && (
          <fieldset className="mt-5">
            <legend className="sr-only">Main activity</legend>
            <div className="grid grid-cols-2 gap-3">
              {ACTIVITIES.map((a) => (
                <label key={a.id}
                  className={`tile flex cursor-pointer flex-col items-center gap-1 p-3 text-center font-medium capitalize text-navy focus-within:outline focus-within:outline-3 focus-within:outline-navy ${
                    p.activity === a.id ? '!border-navy !bg-sun-soft' : ''}`}>
                  <input type="radio" name="activity" className="sr-only" checked={p.activity === a.id} onChange={() => set('activity', a.id)} />
                  <Icon name={a.id} className="h-8 w-8" />
                  {a.id}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {step === 2 && (
          <div className="mt-5 space-y-6">
            <div>
              <label htmlFor="warmth" className="font-medium text-navy">Warmth preference</label>
              <input id="warmth" type="range" min={0} max={100} step={5} value={p.warmth}
                aria-valuetext={p.warmth < 35 ? 'I run cold' : p.warmth > 65 ? 'I run hot' : 'Somewhere in between'}
                onChange={(e) => set('warmth', +e.target.value)} />
              <div className="caption flex justify-between"><span>I run cold</span><span>I run hot</span></div>
            </div>
            <div>
              <label htmlFor="hours" className="font-medium text-navy">Hours outside: <span className="num">{p.hours}h</span></label>
              <input id="hours" type="range" min={1} max={12} value={p.hours} onChange={(e) => set('hours', +e.target.value)} />
              <div className="caption flex justify-between"><span>1h</span><span>12h</span></div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button className="btn-ghost" onClick={back} disabled={step === 0} aria-label="Previous step" style={{ visibility: step === 0 ? 'hidden' : 'visible' }}>← Back</button>
        <div className="flex gap-2" aria-hidden="true">
          {Array.from({ length: STEPS }).map((_, i) => (
            <span key={i} className={`h-2.5 w-2.5 rounded-full ${i === step ? 'bg-navy' : 'bg-frost'}`} />
          ))}
        </div>
        <button className="btn" onClick={next}>{step === STEPS - 1 ? "Let's go" : 'Next'}</button>
      </div>
    </div>
  )
}
