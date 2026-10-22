import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { requireRole } from '@/lib/auth'
import { consumeRateLimit } from '@/lib/analytics/rate-limit'
import { uploadObject } from '@/lib/rustfs'

const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
}
const MAX_SIZE = 10 * 1024 * 1024
const UPLOADS_PER_MINUTE = 20
const FOLDER_PATTERN = /^[a-z0-9][a-z0-9-]{0,31}$/

function sniffMime(buffer: Buffer): string | undefined {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg'
  }
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png'
  }
  if (buffer.length >= 6) {
    const signature = buffer.subarray(0, 6).toString('ascii')
    if (signature === 'GIF87a' || signature === 'GIF89a') return 'image/gif'
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp'
  }
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp') {
    const brand = buffer.subarray(8, 12).toString('ascii')
    if (brand === 'avif' || brand === 'avis') return 'image/avif'
  }
  return undefined
}

export async function POST(req: Request) {
  let user
  try {
    user = await requireRole('admin', 'instructor', 'student')
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === 'Unauthorized'
    return NextResponse.json(
      { error: unauthorized ? 'Unauthorized' : 'Forbidden' },
      { status: unauthorized ? 401 : 403 }
    )
  }

  const limit = consumeRateLimit(`upload:${user.id}`, UPLOADS_PER_MINUTE)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many uploads. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    )
  }

  try {
    const { image, folder = 'general' } = await req.json()

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400 })
    }

    if (typeof folder !== 'string' || !FOLDER_PATTERN.test(folder)) {
      return NextResponse.json({ error: 'Invalid upload folder' }, { status: 400 })
    }

    const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/]+={0,2})$/)
    if (!match) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 })
    }

    const mime = match[1].toLowerCase()
    if (!ALLOWED.includes(mime)) {
      return NextResponse.json({ error: 'Unsupported image type' }, { status: 400 })
    }

    const raw = Buffer.from(match[2], 'base64')
    if (raw.length === 0) {
      return NextResponse.json({ error: 'Empty image data' }, { status: 400 })
    }
    if (raw.length > MAX_SIZE) {
      return NextResponse.json({ error: 'Image exceeds 10 MB limit' }, { status: 413 })
    }
    if (sniffMime(raw) !== mime) {
      return NextResponse.json({ error: 'Image content does not match its declared type' }, { status: 400 })
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
