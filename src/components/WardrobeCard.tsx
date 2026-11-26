import { useState } from 'react'
import { LAYERS, LAYER_LABEL, type ClothingItem, type Layer, type NewClothing } from '../types'
import Mascot from './Mascot'
import Icon, { ItemArt, type IconName } from './Icon'
import { analyzePhoto } from '../api'

interface Props {
  items: ClothingItem[] | null
  onAdd: (i: NewClothing) => Promise<void>
  onToggleWater: (id: string, v: boolean) => void
}

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
              <div className="flex h-12 items-center justify-center text-navy"><ItemArt item={it} className="h-9 w-9" photoClassName="h-12 w-12 rounded-xl" /></div>
              <p className="mt-2 truncate font-medium text-navy" title={it.name}>{it.name}</p>
              <p className="caption">{LAYER_LABEL[it.layer]}</p>
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
  const [looking, setLooking] = useState(false)
  const [seen, setSeen] = useState<{ item: NewClothing; why: string } | null>(null) // what Gemini made of the photo
  const [problem, setProblem] = useState('')

  // Gemini looks at the photo and fills in the fields below; the user can still correct them.
  const onPhoto = async (file: File) => {
    setLooking(true); setProblem(''); setSeen(null)
    try {
      const result = await analyzePhoto(file)
      const g = result.item
      setName(g.name); setLayer(g.layer); setWarmth(g.warmth); setWater(g.waterRepellent)
      setSeen(result)
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'Could not read that photo. Try another one.')
    } finally { setLooking(false) }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    // the photo, fabric and colour come from Gemini; name, layer, warmth and water-repellent are whatever the user left in the form
    await onAdd({ ...seen?.item, name, layer, warmth: warmth as NewClothing['warmth'], waterRepellent: water })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-navy/40 p-4 sm:items-center"
      role="dialog" aria-modal="true" aria-labelledby="add-h" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <form onSubmit={submit} className="card w-full max-w-md space-y-4 p-6">
        <h3 id="add-h" className="h-title">Add a clothing item</h3>
        <div className="grid grid-cols-2 gap-3">
          <PhotoButton icon="camera" label="Take a photo" camera disabled={looking} onPick={onPhoto} />
          <PhotoButton icon="image" label="Choose a photo" disabled={looking} onPick={onPhoto} />
        </div>
        <div aria-live="polite">
          {looking && <p className="caption">Frosty is looking at your photo</p>}
          {problem && <p className="caption">{problem}</p>}
          {seen && (
            <div className="tile flex items-center gap-3 p-3">
              <img src={seen.item.photo} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
              <p className="text-navy"><span className="font-medium">Frosty sees:</span> {seen.why} <span className="caption">Check the details below, then add it.</span></p>
            </div>
          )}
        </div>
        <label className="block font-medium text-navy">Name
          <input autoFocus required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fleece vest"
            className="field mt-1 w-full" />
        </label>
        <label className="block font-medium text-navy">Layer
          <select value={layer} onChange={(e) => setLayer(e.target.value as Layer)}
            className="field mt-1 w-full">
            {LAYERS.map((l) => <option key={l} value={l}>{LAYER_LABEL[l]}</option>)}
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

/** A tile that opens the camera or the photo library and hands back the picked photo. */
function PhotoButton({ icon, label, camera = false, disabled, onPick }: { icon: IconName; label: string; camera?: boolean; disabled: boolean; onPick: (file: File) => void }) {
  return (
    <label className={`tile flex cursor-pointer flex-col items-center gap-1 p-3 text-center font-medium text-navy focus-within:outline focus-within:outline-3 focus-within:outline-navy ${disabled ? 'opacity-60' : ''}`}>
      <input type="file" accept="image/*" capture={camera ? 'environment' : undefined} className="sr-only" disabled={disabled}
        onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) onPick(file) }} />
      <Icon name={icon} className="h-8 w-8" />
      {label}
    </label>
  )
}
