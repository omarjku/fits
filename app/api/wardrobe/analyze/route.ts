import { randomUUID } from 'node:crypto'
import { analyzeItem } from '@/lib/gemini'
import { handle, HttpError } from '@/lib/http'

// POST /api/wardrobe/analyze  { "image": "data:image/jpeg;base64,..." }
export function POST(req: Request) {
  return handle(async () => {
    const body = await req.json().catch(() => { throw new HttpError(400, 'Body must be JSON.') })
    const { item, why } = await analyzeItem(body.image)
    return { item: { id: randomUUID(), ...item }, why }
  })
}
