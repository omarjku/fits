// Sends one photo to the running app's photo-tagging endpoint and checks the answer is well-formed.
// Usage: npm run check:photo -- path/to/photo.jpg [http://localhost:3000]
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const [file, base = 'http://localhost:3000'] = process.argv.slice(2)
if (!file) { console.error('Usage: npm run check:photo -- path/to/photo.jpg [base URL]'); process.exit(2) }
const mime = /\.png$/i.test(file) ? 'image/png' : /\.webp$/i.test(file) ? 'image/webp' : 'image/jpeg'
const res = await fetch(`${base}/api/wardrobe/analyze`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ image: `data:${mime};base64,${readFileSync(file).toString('base64')}` }),
})
const body = await res.json()
if (res.status === 422) { console.log('Not clothing:', body.error); process.exit(0) }
assert.equal(res.status, 200, JSON.stringify(body))
const { item, why } = body
assert.ok(item.id && item.name, 'item has an id and a name')
assert.ok(['base', 'mid', 'outer', 'bottom', 'shoes', 'accessory'].includes(item.slot), `slot is one of the six layers, got ${item.slot}`)
assert.ok(Number.isInteger(item.warmth) && item.warmth >= 0 && item.warmth <= 5, `warmth is 0 to 5, got ${item.warmth}`)
assert.equal(typeof item.waterproof, 'boolean')
assert.equal(typeof item.windproof, 'boolean')
assert.ok(why && why.split(/\s+/).length >= 4, 'Gemini explains its call in a sentence')
console.log(`${item.name}: ${item.slot} layer, warmth ${item.warmth}/5, ${item.waterproof ? 'water-repellent' : 'not water-repellent'} (${item.material}, ${item.color})`)
console.log(`Why: ${why}`)
