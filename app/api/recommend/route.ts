import { demoWardrobe } from '@/lib/demo-wardrobe'
import { chooseOutfit, sanitizeItem } from '@/lib/gemini'
import { handle, HttpError } from '@/lib/http'
import { needs, pickOutfit, reasonFor, SLOTS, type Activity, type Item, type Prefs } from '@/lib/outfit'
import { getWeather } from '@/lib/weather'

// POST /api/recommend  { postcode, country?, place?, activity, activityName?, warmthPref, hours, wardrobe? }
export function POST(req: Request) {
  return handle(async () => {
    const b = await req.json().catch(() => { throw new HttpError(400, 'Body must be JSON.') })
    const prefs: Prefs = {
      activity: (['low', 'moderate', 'high'] as Activity[]).includes(b.activity) ? b.activity : 'moderate',
      warmthPref: Math.min(5, Math.max(1, Math.round(Number(b.warmthPref)) || 3)),
      hours: Math.min(48, Math.max(1, Math.round(Number(b.hours)) || 3)),
      ...(typeof b.activityName === 'string' && /^[A-Za-z ]{2,30}$/.test(b.activityName) ? { activityName: b.activityName } : {}),
    }
    const sent: Item[] = Array.isArray(b.wardrobe) ? b.wardrobe.slice(0, 60).filter((i: any) => i && typeof i.id === 'string' && SLOTS.includes(i.slot)).map(sanitizeItem) : []
    const usedDemoWardrobe = sent.length === 0
    const wardrobe = usedDemoWardrobe ? demoWardrobe : sent

    const weather = await getWeather({ postcode: String(b.postcode ?? ''), country: String(b.country ?? 'AT'), place: String(b.place ?? '') }, prefs.hours)
    const n = needs(weather.window, weather.history.vsLastWeek, prefs)

    const rules = pickOutfit(wardrobe, n)
    const fromGemini = await chooseOutfit(weather, n, prefs, wardrobe, rules).catch((e) => { console.error('Gemini outfit failed, using rules:', e.message); return null })
    const outfit = fromGemini ?? {
      items: rules.map((i) => ({ ...i, reason: reasonFor(i, n) })),
      headline: `Feels like ${Math.round(weather.window.feelsLikeMin)}° in ${weather.place.name}`,
      explanation: n.reasons.join(' ') || 'Comfortable conditions: one light layer is enough.',
      tips: [],
    }
    return { ...outfit, source: fromGemini ? 'gemini' : 'rules', usedDemoWardrobe, needs: n, prefs, weather }
  })
}
