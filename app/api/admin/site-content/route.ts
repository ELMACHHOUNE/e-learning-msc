import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import SiteContent from '@/models/SiteContent'
import {
  SITE_SECTIONS,
  getAllSiteContent,
  sanitizeSiteContent,
} from '@/lib/site-content'
import type { SiteContentKey } from '@/lib/site-content'

export async function GET() {
  await requireRole('admin')
  await connectToDatabase()

  const docs = await getAllSiteContent()
  const byKey = new Map(docs.map((d) => [d.key, d.content]))

  const sections = SITE_SECTIONS.map((meta) => {
    const raw = byKey.get(meta.key)
    let content: Record<string, unknown>
    try {
      content = sanitizeSiteContent(meta.key as SiteContentKey, raw)
    } catch {
      content = {}
    }
    return {
      key: meta.key,
      label: meta.label,
      description: meta.description,
      content,
      hasStored: byKey.has(meta.key),
    }
  })

  return NextResponse.json({ sections })
}

export async function PUT(req: Request) {
  const user = await requireRole('admin')
  const body = await req.json()
  const { key, content } = body

  const meta = SITE_SECTIONS.find((s) => s.key === key)
  if (!meta) {
    return NextResponse.json({ error: 'Unknown site content key' }, { status: 400 })
  }

  let sanitized: Record<string, unknown>
  try {
    sanitized = sanitizeSiteContent(key as SiteContentKey, content)
  } catch {
    return NextResponse.json({ error: 'Invalid content shape' }, { status: 400 })
  }

  await connectToDatabase()

  const doc = await SiteContent.findOneAndUpdate(
    { key },
    { $set: { content: sanitized, updatedBy: user.id } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  return NextResponse.json({
    id: doc._id.toString(),
    key: doc.key,
    content: doc.content,
    updatedAt: doc.updatedAt,
  })
}

export async function DELETE(req: Request) {
  await requireRole('admin')

  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')

  const meta = SITE_SECTIONS.find((s) => s.key === key)
  if (!meta) {
    return NextResponse.json({ error: 'Unknown site content key' }, { status: 400 })
  }

  await connectToDatabase()

  await SiteContent.deleteOne({ key })

  return NextResponse.json({ success: true })
}