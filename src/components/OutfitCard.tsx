import type { OutfitItem, Recommendation } from '../types'
import Mascot from './Mascot'
import Icon, { itemIcon } from './Icon'

const ORDER = ['base', 'mid', 'outer', 'accessory'] as const
const LABEL = { base: 'Base layer', mid: 'Mid layer', outer: 'Outer layer', accessory: 'Accessories' }

export function OutfitList({ items, highlight = [] }: { items: OutfitItem[]; highlight?: string[] }) {
  return (
    <div className="space-y-4">
      {ORDER.map((l) => {
        const group = items.filter((i) => i.item.layer === l)
        if (!group.length) return null
        return (
          <div key={l}>
            <h4 className="caption font-medium">{LABEL[l]}</h4>
            <ul className="mt-1 space-y-2">
              {group.map(({ item, reason }) => (
                <li key={item.id} className={`flex items-center gap-3 rounded-2xl p-2.5 ${highlight.includes(item.id) ? 'bg-sun-soft ring-1 ring-navy' : 'bg-white border border-frost-line'}`}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ice text-navy"><Icon name={itemIcon(item)} className="h-7 w-7" /></span>
                  <div className="min-w-0">
                    <p className="font-medium text-navy">{item.name}{highlight.includes(item.id) && <span className="caption ml-2">(extra)</span>}</p>
                    <p className="caption">{reason}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

interface Props {
  loading: boolean
  rec: Recommendation | null
  onAsk: () => void
}

export default function OutfitSection({ loading, rec, onAsk }: Props) {
  return (
    <section aria-labelledby="outfit-h" aria-live="polite" className="space-y-4">
      <h2 id="outfit-h" className="sr-only">Outfit recommendation</h2>
      <button className="btn w-full py-5 text-2xl" onClick={onAsk} disabled={loading}>
        {loading ? 'Thinking' : 'What should I wear?'}
      </button>

      {loading && (
        <div className="card flex flex-col items-center p-6 text-center" role="status">
          <Mascot size={96} mood="shiver" />
          <p className="h-sub mt-2">Picking your layers</p>
        </div>
      )}

      {!loading && !rec && (
        <div className="card flex flex-col items-center p-6 text-center">
          <Mascot size={80} />
          <p className="mt-2">Frosty dresses you from your own wardrobe.</p>
        </div>
      )}

      {!loading && rec && (
        <div className="card p-6">
          <h3 className="h-hero">Wear this in {rec.place.split(',')[0]}</h3>
          <div className="mt-5"><OutfitList items={rec.items} /></div>
          <div className="tile mt-5 p-4">
            <p className="text-navy">{rec.summary}</p>
          </div>
        </div>
      )}
    </section>
  )
}
