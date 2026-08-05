'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Award, X, User, Calendar, Clock, Hash, GraduationCap, Building2 } from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import { toast } from '@/components/ui/alert'
import { downloadCertificate } from '@/lib/certificate'
import type { CertificateData } from '@/types/certificate'

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-md">
      <div className="w-10 h-10 bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-caption text-mute uppercase tracking-[0.1em] font-600 block">
          {label}
        </span>
        <p className="text-body-sm text-ink font-600 break-words mt-xs">{value || '—'}</p>
      </div>
    </div>
  )
}

interface CertificateDialogProps {
  open: boolean
  onClose: () => void
  data: CertificateData
}

export function CertificateDialog({ open, onClose, data }: CertificateDialogProps) {
  const [generating, setGenerating] = useState(false)

  if (!open) return null

  async function handleGenerate() {
    setGenerating(true)
    try {
      await downloadCertificate(data)
      toast({ variant: 'success', title: 'Certificate generated successfully.' })
      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate certificate'
      toast({ variant: 'error', title: 'Generation failed', message })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/45 grid place-items-center px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-canvas border border-hairline shadow-[0_20px_60px_rgba(0,0,0,0.2)] w-[560px] max-w-[calc(100vw-2rem)] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Generate certificate"
      >
        <div className="flex items-center justify-between px-xl py-lg border-b border-hairline bg-surface-soft">
          <div className="flex items-center gap-md">
            <div className="w-10 h-10 bg-primary text-on-primary flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-heading-sm text-ink font-700">Export Certificate</h2>
              <p className="text-caption text-mute">Official certificate for {data.studentFullName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-transparent border-none cursor-pointer text-mute hover:text-ink p-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-xl space-y-lg overflow-y-auto max-h-[55vh]">
          <DetailRow icon={User} label="Student Name" value={data.studentFullName} />
          <DetailRow icon={User} label="Instructor" value={data.instructorName} />
          <DetailRow icon={Building2} label="Academy" value={data.academyName} />
          <DetailRow icon={Clock} label="Training Duration" value={data.durationF} />
          <DetailRow icon={Calendar} label="Formation Date" value={data.formationDate} />
          <div className="flex items-start gap-md">
            <div className="w-10 h-10 bg-primary/10 flex items-center justify-center shrink-0">
              <Hash className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-caption text-mute uppercase tracking-[0.1em] font-600 block">
                Certificate ID
              </span>
              <div className="flex items-center gap-md mt-xs">
                <code className="text-body-sm text-ink bg-surface-soft border border-hairline px-sm py-xs">
                  {data.certificateId}
                </code>
                <Badge variant="success">Verified</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-md p-xl border-t border-hairline">
          <Button variant="outline-dark" onClick={onClose} disabled={generating}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <>
                <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin mr-1" />
                Generating...
              </>
            ) : (
              <>
                <Award className="w-4 h-4 mr-1" /> Generate Certificate
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
