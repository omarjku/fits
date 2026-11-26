export type Activity = 'walking' | 'commuting' | 'hiking' | 'skiing' | 'sitting outside'
export type Layer = 'base' | 'mid' | 'outer' | 'accessory'

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
}
