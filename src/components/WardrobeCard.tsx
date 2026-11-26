import { useState } from 'react'
import type { ClothingItem, Layer, NewClothing } from '../types'
import Mascot from './Mascot'
import Icon, { itemIcon } from './Icon'

interface Props {
  items: ClothingItem[] | null
  onAdd: (i: NewClothing) => Promise<void>
  onToggleWater: (id: string, v: boolean) => void
}

const LAYERS: Layer[] = ['base', 'mid', 'outer', 'accessory']

export default function WardrobeCard({ items, onAdd, onToggleWater }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <section className="card p-5" aria-labelledby="ward-h">
      <h2 id="ward-h" className="h-title">Your wardrobe</h2>
      {!items ? (
        <div className="mt-2 flex items-center gap-3"><Mascot size={48} mood="shiver" /><p>Opening the closet</p></div>
      ) : (
        <ul className="no-scrollbar -mx-5 mt-3 flex snap-x gap-3 overflow-x-auto px-5 pb-3">
          {items.map((it) => (
            <li key={it.id} className="tile w-36 shrink-0 snap-start p-3">
              <div className="flex h-12 items-center justify-center text-navy"><Icon name={itemIcon(it)} className="h-9 w-9" /></div>
              <p className="mt-2 truncate font-medium text-navy" title={it.name}>{it.name}</p>
              <p className="caption capitalize">{it.layer} layer</p>
              <p className="mt-1 text-xs" aria-label={`Warmth ${it.warmth} out of 5`}>
                {Array.from({ length: 5 }).map((_, i) => <span key={i} aria-hidden="true" className={i < it.warmth ? 'text-navy' : 'text-frost'}>●</span>)}
              </p>
              <label className="caption mt-2 flex cursor-pointer items-center gap-2">
                <input type="checkbox" role="switch" className="h-4 w-4 accent-[#2B3470]" checked={it.waterRepellent}
                  onChange={(e) => onToggleWater(it.id, e.target.checked)} />
                Water-repellent
              </label>
            </li>
          ))}
          <li className="shrink-0 snap-start">
            <button onClick={() => setOpen(true)} aria-haspopup="dialog"
              className="flex h-full min-h-[11.5rem] w-32 flex-col items-center justify-center gap-1 rounded-[14px] border border-dashed border-navy text-navy">
              <Icon name="plus" className="h-7 w-7" />
              <span className="font-medium">Add item</span>
            </button>
          </li>
        </ul>
      )}
      {open && <AddForm onClose={() => setOpen(false)} onAdd={onAdd} />}
    </section>
  )
}

function AddForm({ onClose, onAdd }: { onClose: () => void; onAdd: (i: NewClothing) => Promise<void> }) {
  const [name, setName] = useState('')
  const [layer, setLayer] = useState<Layer>('mid')
  const [warmth, setWarmth] = useState(3)
  const [water, setWater] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    await onAdd({ name, layer, warmth: warmth as NewClothing['warmth'], waterRepellent: water })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-navy/40 p-4 sm:items-center"
      role="dialog" aria-modal="true" aria-labelledby="add-h" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <form onSubmit={submit} className="card w-full max-w-md space-y-4 p-6">
        <h3 id="add-h" className="h-title">Add a clothing item</h3>
        <label className="block font-medium text-navy">Name
          <input autoFocus required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fleece vest"
            className="field mt-1 w-full" />
        </label>
        <label className="block font-medium text-navy">Layer
          <select value={layer} onChange={(e) => setLayer(e.target.value as Layer)}
            className="field mt-1 w-full capitalize">
            {LAYERS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
        <div>
          <label htmlFor="warmth-in" className="font-medium text-navy">Warmth: {warmth} / 5</label>
          <input id="warmth-in" type="range" min={1} max={5} value={warmth} onChange={(e) => setWarmth(+e.target.value)} />
        </div>
        <label className="flex items-center gap-2 font-medium text-navy">
          <input type="checkbox" className="h-5 w-5 accent-[#2B3470]" checked={water} onChange={(e) => setWater(e.target.checked)} />
          Water-repellent
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn" disabled={busy}>{busy ? 'Adding' : 'Add item'}</button>
        </div>
      </form>
    </div>
  )
}
