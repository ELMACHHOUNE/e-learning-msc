import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { uploadObject } from '@/lib/rustfs'

const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif']
const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
}
const MAX_SIZE = 10 * 1024 * 1024

export async function POST(req: Request) {
  try {
    const { image, folder = 'general' } = await req.json()

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400 })
    }

    const match = image.match(/^data:(image\/\w+);base64,(.+)$/)
    if (!match) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 })
    }

    const mime = match[1]
    if (!ALLOWED.includes(mime)) {
      return NextResponse.json({ error: `Unsupported image type: ${mime}` }, { status: 400 })
    }

    const raw = Buffer.from(match[2], 'base64')
    if (raw.length > MAX_SIZE) {
      return NextResponse.json({ error: 'Image exceeds 10 MB limit' }, { status: 400 })
    }

    const ext = MIME_EXT[mime]
    const name = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`

    const url = await uploadObject({
      folder,
      name,
      body: raw,
      contentType: mime,
    })

    return NextResponse.json({ url })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}