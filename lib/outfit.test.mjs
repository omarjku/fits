// Run with: npm test
import test from 'node:test'
import assert from 'node:assert/strict'
import { needs, pickOutfit } from './outfit.ts'
import { demoWardrobe } from './demo-wardrobe.ts'

const mild = { feelsLikeMin: 18, feelsLikeAvg: 19, windMax: 8, precipMm: 0, precipProbMax: 5, snowCm: 0 }
const snowy = { feelsLikeMin: -4, feelsLikeAvg: -2, windMax: 32, precipMm: 3, precipProbMax: 80, snowCm: 4 }
const walk = { activity: 'moderate', warmthPref: 3, hours: 1 }
const names = (items) => items.map((i) => i.id)

test('mild dry day: light outfit, no coat, no gloves', () => {
  const n = needs(mild, 0, walk)
  assert.equal(n.waterproof, false)
  assert.equal(n.accessories, false)
  const fit = pickOutfit(demoWardrobe, n)
  assert.ok(!fit.some((i) => i.slot === 'accessory'), names(fit).join())
  assert.ok(fit.filter((i) => ['base', 'mid', 'outer'].includes(i.slot)).reduce((t, i) => t + i.warmth, 0) <= 4)
})

test('snowy windy day: waterproof warm outer, warm shoes, accessories', () => {
  const n = needs(snowy, -6, walk)
  assert.equal(n.waterproof, true)
  assert.equal(n.windproof, true)
  const fit = pickOutfit(demoWardrobe, n)
  const outer = fit.find((i) => i.slot === 'outer')
  assert.equal(outer?.id, 'demo-parka', names(fit).join())
  assert.equal(fit.find((i) => i.slot === 'shoes')?.waterproof, true)
  assert.ok(fit.some((i) => i.id === 'demo-gloves'))
  assert.ok(['base', 'bottom', 'shoes'].every((s) => fit.some((i) => i.slot === s)))
})

test('same weather: running cold and standing still asks for more warmth than running hot and moving', () => {
  const cold = needs(snowy, 0, { activity: 'low', warmthPref: 1, hours: 5 })
  const hot = needs(snowy, 0, { activity: 'high', warmthPref: 5, hours: 1 })
  assert.ok(cold.topWarmth > hot.topWarmth)
  assert.ok(cold.effectiveTemp < snowy.feelsLikeMin && hot.effectiveTemp > snowy.feelsLikeMin)
})
