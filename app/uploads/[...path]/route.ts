import { NextResponse } from 'next/server'
import { getObject } from '@/lib/rustfs'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  if (!path || path.length < 2) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const key = `uploads/${path.join('/')}`

  try {
    const obj = await getObject(key)
    const bytes = obj.Body ? await obj.Body.transformToByteArray() : undefined
    if (!bytes) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': obj.ContentType ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (err) {
    const status =
      (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
    return NextResponse.json({ error: 'Not found' }, { status: status === 404 ? 404 : 500 })
  }
}