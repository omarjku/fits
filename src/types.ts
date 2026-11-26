export type Activity = 'walking' | 'commuting' | 'hiking' | 'skiing' | 'sitting outside'
// The layers an outfit is built from, in the order they are listed. The same six the backend calls "slots".
export const LAYERS = ['base', 'mid', 'outer', 'bottom', 'shoes', 'accessory'] as const
export type Layer = (typeof LAYERS)[number]
export const LAYER_LABEL: Record<Layer, string> = {
  base: 'Base layer', mid: 'Mid layer', outer: 'Outer layer', bottom: 'Bottoms', shoes: 'Shoes', accessory: 'Accessories',
}

export interface Preferences {
  postcode: string
  country: string
  activity: Activity
  warmth: number // 0 (I run cold) .. 100 (I run hot)
  hours: number // 1..12
}

export interface ClothingItem {
  id: string
  name: string
  emoji: string
  layer: Layer
  warmth: 1 | 2 | 3 | 4 | 5
  waterRepellent: boolean
  // set when the item was added from a photo
  photo?: string // small thumbnail, as a data URL
  material?: string
  color?: string
}

export interface HourlyPoint { hour: string; temp: number }

export interface Weather {
  place: string
  hourly: HourlyPoint[]
  feelsLike: number
  windKmh: number
  humidity: number
  rainMm: number
  snowCm: number
}

export interface Historical {
  place: string
  avgTemp: number
  avgLow: number
  avgHigh: number
  windKmh: number
  precipMm: number
}

export interface OutfitItem {
  item: ClothingItem
  reason: string
}

export interface Recommendation {
  place: string
  weather: Weather
  historical: Historical
  items: OutfitItem[]
  summary: string
}

export interface NewClothing {
  name: string
  layer: Layer
  warmth: 1 | 2 | 3 | 4 | 5
  waterRepellent: boolean
  emoji?: string
  photo?: string
  material?: string
  color?: string
}
