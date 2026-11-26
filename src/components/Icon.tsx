import type { ClothingItem, Activity } from '../types'

const P = {
  tee: 'M8 4 3 7l2 4 3-1v10h8V10l3 1 2-4-5-3a4 4 0 0 1-8 0z',
  longsleeve: 'M9 4 3 8l1 11 3-.5.5-7.5.5 9h8l.5-9 .5 7.5 3 .5 1-11-6-4a3.5 3.5 0 0 1-6 0z',
  sweater: 'M8 4 3 7l2 4 3-1v10h8V10l3 1 2-4-5-3a4 4 0 0 1-8 0zM8 17h8',
  jacket: 'M9 3 4 7v13h5V9m6-6 5 4v13h-5V9m-6-6a3 3 0 0 0 6 0M12 12v8',
  hat: 'M5 15a7 7 0 0 1 14 0zM4 15h16v3H4zM12 5V3',
  scarf: 'M5 8q7 4 14 0v4q-7 4-14 0zM14 13l1 7h3l-1-7',
  gloves: 'M8 21v-5l-3-4 1.5-1.5L9 13V5a1 1 0 0 1 2 0v6V4a1 1 0 0 1 2 0v7V5a1 1 0 0 1 2 0v8l1-3a1 1 0 0 1 2 1l-1 6v4z',
  trousers: 'M7 3h10l1.5 18h-4.5L12 9l-2 12H5.5zM7 6h10',
  shoe: 'M3 18v-5l3-1 2.5-5 3 1.5.5 3.5 6 2.5q3 1 3 4zM3 15.5h18',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15.5 9.5h.01',
  drop: 'M12 3c3 4.5 5 7.5 5 10a5 5 0 0 1-10 0c0-2.5 2-5.5 5-10z',
  plus: 'M12 5v14M5 12h14',
  sliders: 'M4 7h10M18 7h2M4 17h2M10 17h10M16 5v4M8 15v4',
  walking: 'M13 5.5a1.5 1.5 0 1 0 0-.01M12 21l2-6-3-3 1-4 3 2 3 1M9 10l-2 4M11 15l-3 6',
  commuting: 'M3 16a3 3 0 1 0 6 0 3 3 0 0 0-6 0M15 16a3 3 0 1 0 6 0 3 3 0 0 0-6 0M6 16l4-7h5l3 7M10 9l2 7M9 6h3',
  hiking: 'M3 20l6-11 4 7 3-4 5 8z',
  skiing: 'M3 19l18-4M8 7l3 8M15 4l2 9M6 5l3 2',
  'sitting outside': 'M5 9h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM16 11h2a2 2 0 0 1 0 4h-2M8 3v2M12 3v2',
}

export type IconName = keyof typeof P

export function itemIcon(it: Pick<ClothingItem, 'name' | 'layer'>): IconName {
  const n = it.name.toLowerCase()
  if (it.layer === 'bottom') return 'trousers'
  if (it.layer === 'shoes') return 'shoe'
  if (/glove|mitt/.test(n)) return 'gloves'
  if (/scarf/.test(n)) return 'scarf'
  if (/beanie|hat|cap/.test(n)) return 'hat'
  if (/sweater|jumper|fleece|wool/.test(n) && it.layer === 'mid') return 'sweater'
  if (/jacket|shell|coat|parka/.test(n)) return 'jacket'
  if (/merino|base|long/.test(n)) return 'longsleeve'
  if (/tee|shirt/.test(n)) return 'tee'
  return ({ base: 'tee', mid: 'sweater', outer: 'jacket', bottom: 'trousers', shoes: 'shoe', accessory: 'scarf' } as const)[it.layer]
}

export const activityIcon = (a: Activity): IconName => a

/** A wardrobe item's picture: its own photo when it has one, otherwise the line icon for its kind. */
export function ItemArt({ item, className, photoClassName }: { item: Pick<ClothingItem, 'name' | 'layer' | 'photo'>; className: string; photoClassName: string }) {
  return item.photo
    ? <img src={item.photo} alt="" className={`${photoClassName} object-cover`} />
    : <Icon name={itemIcon(item)} className={className} />
}

/** One style everywhere: 24px grid, 1.6 stroke, round caps, line only. */
export default function Icon({ name, className = 'h-6 w-6' }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={P[name]} /></svg>
  )
}
