import { demoWardrobe } from '@/lib/demo-wardrobe'

// GET /api/wardrobe/demo
export function GET() {
  return Response.json({ items: demoWardrobe })
}
