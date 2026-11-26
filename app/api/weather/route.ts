import { handle } from '@/lib/http'
import { getWeather } from '@/lib/weather'

// GET /api/weather?postcode=4020&country=AT&hours=3   or   /api/weather?place=Wales
export function GET(req: Request) {
  const q = new URL(req.url).searchParams
  return handle(() => getWeather({ postcode: q.get('postcode') ?? '', country: q.get('country') ?? 'AT', place: q.get('place') ?? '' }, Number(q.get('hours') ?? 3)))
}
