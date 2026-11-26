// Pure rules: weather + preferences -> what the outfit must achieve, plus a
// rule-based picker used when Gemini is unavailable. No I/O, tested in outfit.test.mjs.

export const SLOTS = ['base', 'mid', 'outer', 'bottom', 'shoes', 'accessory'] as const
export type Slot = (typeof SLOTS)[number]

export type Item = {
  id: string
  name: string
  slot: Slot
  warmth: number // 0 (umbrella) .. 5 (winter coat)
  waterproof: boolean
  windproof: boolean
  material?: string
  color?: string
  emoji?: string
}

export type Activity = 'low' | 'moderate' | 'high'
export type Prefs = { activity: Activity; warmthPref: number; hours: number }

export type Conditions = {
  feelsLikeMin: number
  feelsLikeAvg: number
  windMax: number
  precipMm: number
  precipProbMax: number
  snowCm: number
}

export type Needs = {
  effectiveTemp: number
  topWarmth: number // target sum of warmth across base + mid + outer
  bottomWarmth: number
  waterproof: boolean
  windproof: boolean
  accessories: boolean
  reasons: string[]
}

const ACTIVITY_OFFSET: Record<Activity, number> = { low: -3, moderate: 0, high: 5 }
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** vsLastWeek: how much colder (negative) or warmer today feels than the past 7 days. */
export function needs(c: Conditions, vsLastWeek: number | null, p: Prefs): Needs {
  const reasons: string[] = []
  let eff = c.feelsLikeMin

  eff += ACTIVITY_OFFSET[p.activity]
  if (p.activity === 'low') reasons.push('You will be standing still, so you produce little body heat.')
  if (p.activity === 'high') reasons.push('You will be moving a lot, so you can dress lighter.')

  const pref = (clamp(p.warmthPref, 1, 5) - 3) * 2
  eff += pref
  if (pref < 0) reasons.push('You run cold, so the outfit is one notch warmer.')
  if (pref > 0) reasons.push('You run warm, so the outfit is one notch lighter.')

  if (p.hours > 4) { eff -= 2; reasons.push(`${p.hours} hours outside: long exposure cools you down.`) }
  else if (p.hours > 2) eff -= 1

  if (vsLastWeek !== null && vsLastWeek <= -4) {
    eff -= 1
    reasons.push(`It feels ${Math.abs(Math.round(vsLastWeek))}° colder than the past week, and your body is not used to it yet.`)
  }

  const waterproof = c.precipProbMax >= 40 || c.precipMm >= 0.5 || c.snowCm > 0
  const windproof = c.windMax >= 25
  if (c.snowCm > 0) reasons.push(`Snow expected (${c.snowCm.toFixed(1)} cm): pick water-repellent layers.`)
  else if (waterproof) reasons.push('Rain is likely: pick water-repellent layers.')
  if (windproof) reasons.push(`Wind up to ${Math.round(c.windMax)} km/h: a windproof outer layer matters.`)

  return {
    effectiveTemp: Math.round(eff * 10) / 10,
    // 20° -> 2 (a tee), 10° -> 6 (tee + hoodie + light jacket), 0° -> 10, -5° -> 12
    topWarmth: clamp(Math.round((26 - eff) / 2.6), 1, 15),
    bottomWarmth: eff < 0 ? 4 : eff < 8 ? 3 : eff < 18 ? 2 : 1,
    waterproof,
    windproof,
    accessories: eff < 6,
    reasons,
  }
}

/** Rule-based outfit: the combination of base/mid/outer closest to the warmth target. */
export function pickOutfit(wardrobe: Item[], n: Needs): Item[] {
  const by = (s: Slot) => wardrobe.filter((i) => i.slot === s)
  const optional = (s: Slot): (Item | null)[] => [null, ...by(s)]

  let best: Item[] = []
  let bestScore = Infinity
  // ponytail: brute force over base x mid x outer, fine for a wardrobe of dozens of items
  for (const base of by('base')) for (const mid of optional('mid')) for (const outer of optional('outer')) {
    const combo = [base, mid, outer].filter((i): i is Item => i !== null)
    const sum = combo.reduce((t, i) => t + i.warmth, 0)
    const score = Math.abs(sum - n.topWarmth)
      + (n.waterproof && !outer?.waterproof ? 4 : 0)
      + (n.windproof && !outer?.windproof ? 2 : 0)
    if (score < bestScore) { bestScore = score; best = combo }
  }

  const closest = (s: Slot, target: number) =>
    by(s).sort((a, b) =>
      (Math.abs(a.warmth - target) - (n.waterproof && a.waterproof ? 1.5 : 0)) -
      (Math.abs(b.warmth - target) - (n.waterproof && b.waterproof ? 1.5 : 0)))[0]

  const bottom = closest('bottom', n.bottomWarmth)
  const shoes = closest('shoes', n.effectiveTemp < 3 ? 5 : n.effectiveTemp < 12 ? 3 : 2)
  const accessories = by('accessory').filter((a) =>
    a.warmth > 0 ? n.accessories : a.waterproof && n.waterproof)

  return [...best, bottom, shoes, ...accessories].filter(Boolean)
}
