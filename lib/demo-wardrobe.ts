import type { Item } from './outfit'

// Fallback wardrobe so the demo works before any photo is uploaded.
export const demoWardrobe: Item[] = [
  { id: 'demo-tee', name: 'White cotton T-shirt', slot: 'base', warmth: 1, waterproof: false, windproof: false, material: 'cotton', color: 'white', emoji: '👕' },
  { id: 'demo-longsleeve', name: 'Merino long-sleeve', slot: 'base', warmth: 2, waterproof: false, windproof: false, material: 'merino wool', color: 'grey', emoji: '👚' },
  { id: 'demo-shirt', name: 'Flannel shirt', slot: 'base', warmth: 2, waterproof: false, windproof: false, material: 'cotton flannel', color: 'red check', emoji: '👔' },
  { id: 'demo-hoodie', name: 'Cotton hoodie', slot: 'mid', warmth: 3, waterproof: false, windproof: false, material: 'cotton', color: 'navy', emoji: '🧥' },
  { id: 'demo-knit', name: 'Chunky wool sweater', slot: 'mid', warmth: 4, waterproof: false, windproof: false, material: 'wool', color: 'cream', emoji: '🧶' },
  { id: 'demo-fleece', name: 'Fleece jacket', slot: 'mid', warmth: 3, waterproof: false, windproof: false, material: 'polyester fleece', color: 'green', emoji: '🧥' },
  { id: 'demo-denim-jacket', name: 'Denim jacket', slot: 'outer', warmth: 2, waterproof: false, windproof: false, material: 'denim', color: 'blue', emoji: '🧥' },
  { id: 'demo-rain-shell', name: 'Rain shell', slot: 'outer', warmth: 2, waterproof: true, windproof: true, material: 'coated nylon', color: 'yellow', emoji: '🧥' },
  { id: 'demo-puffer', name: 'Down puffer jacket', slot: 'outer', warmth: 5, waterproof: false, windproof: true, material: 'down', color: 'black', emoji: '🧥' },
  { id: 'demo-parka', name: 'Waterproof winter parka', slot: 'outer', warmth: 5, waterproof: true, windproof: true, material: 'insulated shell', color: 'olive', emoji: '🧥' },
  { id: 'demo-chinos', name: 'Light chinos', slot: 'bottom', warmth: 2, waterproof: false, windproof: false, material: 'cotton', color: 'beige', emoji: '👖' },
  { id: 'demo-jeans', name: 'Jeans', slot: 'bottom', warmth: 3, waterproof: false, windproof: false, material: 'denim', color: 'dark blue', emoji: '👖' },
  { id: 'demo-lined-trousers', name: 'Fleece-lined trousers', slot: 'bottom', warmth: 4, waterproof: true, windproof: true, material: 'softshell', color: 'black', emoji: '👖' },
  { id: 'demo-sneakers', name: 'Canvas sneakers', slot: 'shoes', warmth: 2, waterproof: false, windproof: false, material: 'canvas', color: 'white', emoji: '👟' },
  { id: 'demo-leather-boots', name: 'Leather boots', slot: 'shoes', warmth: 3, waterproof: true, windproof: true, material: 'leather', color: 'brown', emoji: '🥾' },
  { id: 'demo-winter-boots', name: 'Lined winter boots', slot: 'shoes', warmth: 5, waterproof: true, windproof: true, material: 'lined leather', color: 'black', emoji: '🥾' },
  { id: 'demo-beanie', name: 'Wool beanie', slot: 'accessory', warmth: 2, waterproof: false, windproof: false, material: 'wool', color: 'grey', emoji: '🧢' },
  { id: 'demo-scarf', name: 'Scarf', slot: 'accessory', warmth: 2, waterproof: false, windproof: false, material: 'wool', color: 'burgundy', emoji: '🧣' },
  { id: 'demo-gloves', name: 'Gloves', slot: 'accessory', warmth: 2, waterproof: false, windproof: true, material: 'leather', color: 'black', emoji: '🧤' },
  { id: 'demo-umbrella', name: 'Umbrella', slot: 'accessory', warmth: 0, waterproof: true, windproof: false, color: 'black', emoji: '☂️' },
]
