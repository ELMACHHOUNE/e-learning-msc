import { NextResponse } from 'next/server'
import { PDFDocument, PDFName, rgb, StandardFonts } from 'pdf-lib'
import path from 'path'
import fs from 'fs/promises'
import zlib from 'zlib'
import { requireRole } from '@/lib/auth'

interface FieldConfig {
  x: number
  y: number
  w: number
  h: number
  font: StandardFonts
  centered: boolean
}

const FIELDS: Record<string, FieldConfig> = {
  studentFullName: {
    x: 1078, y: 1445, w: 1352, h: 184,
    font: StandardFonts.TimesRomanBold, centered: true,
  },
  durationF: {
    x: 1071, y: 754, w: 210, h: 55,
    font: StandardFonts.TimesRoman, centered: false,
  },
  formationDate: {
    x: 1513, y: 753, w: 342, h: 60,
    font: StandardFonts.TimesRoman, centered: false,
  },
  certificateId: {
    x: 2335, y: 754, w: 257, h: 55,
    font: StandardFonts.TimesRoman, centered: false,
  },
  instructorName: {
    x: 1169, y: 246, w: 368, h: 55,
    font: StandardFonts.Helvetica, centered: false,
  },
  academyName: {
    x: 2082, y: 251, w: 354, h: 55,
    font: StandardFonts.Helvetica, centered: false,
  },
}

const ERASE_TARGETS = [
  { x: 1078, y: 1445 },
  { x: 1071, y: 754 },
  { x: 1513, y: 753 },
  { x: 2335, y: 754 },
  { x: 1169, y: 246 },
  { x: 2082, y: 251 },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function erasePlaceholdersFromContentStream(page: any, context: any): void {
  try {
    const contents = page.node.get(PDFName.of('Contents')) as { size: () => number; get: (i: number) => unknown } | null
    if (!contents || typeof contents.size !== 'function') return

    for (let i = 0; i < contents.size(); i++) {
      const ref = contents.get(i)
      const obj = context.lookup(ref)
      if (!obj || !('contents' in obj)) continue

      const raw = obj as { contents: Uint8Array }
      const decoded = zlib.inflateSync(new Uint8Array(raw.contents)).toString('utf-8')

      let tm_a = 1, tm_b = 0, tm_c = 0, tm_d = 1, tm_e = 0, tm_f = 0
      const lines = decoded.split('\n')
      const modifiedLines: string[] = []

      for (const line of lines) {
        const trimmed = line.trim()

        const tmMatch = trimmed.match(
          /^([\d.+-]+)\s+([\d.+-]+)\s+([\d.+-]+)\s+([\d.+-]+)\s+([\d.+-]+)\s+([\d.+-]+)\s+Tm$/,
        )
        if (tmMatch) {
          tm_a = parseFloat(tmMatch[1])
          tm_b = parseFloat(tmMatch[2])
          tm_c = parseFloat(tmMatch[3])
          tm_d = parseFloat(tmMatch[4])
          tm_e = parseFloat(tmMatch[5])
          tm_f = parseFloat(tmMatch[6])
        }

        const tdMatch = trimmed.match(/^([\d.+-]+)\s+([\d.+-]+)\s+Td$/)
        if (tdMatch) {
          const tlx = parseFloat(tdMatch[1])
          const tly = parseFloat(tdMatch[2])
          tm_e += tlx * tm_a + tly * tm_c
          tm_f += tlx * tm_b + tly * tm_d
        }

        const nearTarget = ERASE_TARGETS.some(
          (t) => Math.abs(tm_e - t.x) < 50 && Math.abs(tm_f - t.y) < 30,
        )

        if (nearTarget) {
          if (/^<[0-9A-Fa-f]+>\s*Tj$/.test(trimmed)) {
            modifiedLines.push(line.replace(/<[0-9A-Fa-f]+>\s*Tj/i, '<> Tj'))
            continue
          }
          if (/^\([^)]*\)\s*Tj$/.test(trimmed)) {
            modifiedLines.push(line.replace(/\([^)]*\)\s*Tj/, '() Tj'))
            continue
          }
          if (/^\[.*\]\s*TJ$/.test(trimmed)) {
            modifiedLines.push(line.replace(/\[.*\]\s*TJ/, '[] TJ'))
            continue
          }
        }

        modifiedLines.push(line)
      }

      const modified = modifiedLines.join('\n')
      if (modified !== decoded) {
        raw.contents = Buffer.from(zlib.deflateSync(Buffer.from(modified, 'utf-8')))
      }
    }
  } catch {
    // silent — generation works without erasure
  }
}

export async function POST(request: Request) {
  await requireRole('admin', 'instructor', 'student')

  try {
    const data = await request.json()
    const { studentFullName, durationF, formationDate, certificateId, instructorName, academyName } = data

    if (!studentFullName) {
      return NextResponse.json({ error: 'studentFullName is required' }, { status: 400 })
    }

    const templatePath = path.join(
      process.cwd(),
      'public',
      'certificates',
      'PDF',
      'certificate.pdf',
    )

    const templateBytes = await fs.readFile(templatePath)
    const pdfDoc = await PDFDocument.load(templateBytes)
    const page = pdfDoc.getPages()[0]

    erasePlaceholdersFromContentStream(page, pdfDoc.context)

    const values: Record<string, string> = {
      studentFullName,
      durationF: durationF ?? '',
      formationDate: formationDate ?? '',
      certificateId: certificateId ?? '',
      instructorName: instructorName ?? '',
      academyName: academyName ?? '',
    }

    for (const [name, value] of Object.entries(values)) {
      const cfg = FIELDS[name]
      if (!cfg) continue
      if (!value) continue

      const font = await pdfDoc.embedFont(cfg.font)

      let drawX: number
      if (cfg.centered) {
        const textWidth = font.widthOfTextAtSize(value, cfg.h)
        drawX = cfg.x + (cfg.w - textWidth) / 2
      } else {
        drawX = cfg.x
      }

      page.drawText(value, {
        x: drawX,
        y: cfg.y,
        size: cfg.h,
        font,
        color: rgb(0, 0, 0),
      })
    }

    const pdfBytes = await pdfDoc.save()

    const safeName = studentFullName.replace(/[^a-zA-Z0-9]/g, '_')
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeName}_certificate.pdf"`,
      },
    })
  } catch (error) {
    console.error('Certificate generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
