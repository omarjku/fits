import { handle } from '@/lib/http'
import { getWeather } from '@/lib/weather'

// GET /api/weather?postcode=4020&country=AT&hours=3
export function GET(req: Request) {
  const q = new URL(req.url).searchParams
  return handle(() => getWeather(q.get('postcode') ?? '', q.get('country') ?? 'AT', Number(q.get('hours') ?? 3)))
}
