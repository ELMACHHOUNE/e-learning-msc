import { NextResponse } from 'next/server'
import { getObject } from '@/lib/rustfs'

const SAFE_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/

function isValidUploadPath(path: string[]) {
  if (!Array.isArray(path) || path.length < 2 || path.length > 8) return false
  return path.every((segment) => typeof segment === 'string' && SAFE_SEGMENT.test(segment))
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  if (!isValidUploadPath(path)) {
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
    const httpStatus = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
    const code = (err as { name?: string; Code?: string }).name ?? (err as { Code?: string }).Code

    if (httpStatus === 404 || code === 'NoSuchKey' || code === 'NotFound') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    console.error('Failed to stream upload', key, err)
    return NextResponse.json({ error: 'Storage unavailable' }, { status: 502 })
  }
}
