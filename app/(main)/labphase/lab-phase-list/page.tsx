'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button, Badge } from '@/components/ui'
import LogoSpinner from '@/components/shared/logo-spinner'
import { toast } from '@/components/ui/alert'
import { ImageUpload } from '@/components/ui/image-upload'
import { FlaskConical, Plus, Edit3, Trash2, CheckCircle, XCircle, X, Save, ImageIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface LabPhaseData {
  id: string
  title: string
  description: string
  instructions: string
  duration: string
  image?: string
  category?: string
  status: 'pending' | 'approved' | 'rejected'
  createdBy: { id: string; name: string } | null
  rejectionReason?: string
  createdAt: string
}

const statusConfig: Record<string, { variant: 'default' | 'success' | 'warning' | 'error'; label: string }> = {
  approved: { variant: 'success', label: 'Approved' },
  pending: { variant: 'warning', label: 'Pending Review' },
  rejected: { variant: 'error', label: 'Rejected' },
}

function LabPhaseModal({
  lab,
  onClose,
  onSave,
}: {
  lab?: LabPhaseData | null
  onClose: () => void
  onSave: () => void
}) {
  const [title, setTitle] = useState(lab?.title ?? '')
  const [description, setDescription] = useState(lab?.description ?? '')
  const [instructions, setInstructions] = useState(lab?.instructions ?? '')
  const [duration, setDuration] = useState(lab?.duration ?? '')
  const [image, setImage] = useState(lab?.image ?? '')
  const [category, setCategory] = useState(lab?.category ?? '')
  const [categoryOptions, setCategoryOptions] = useState<{ id: string; name: string }[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((data) => setCategoryOptions(data.categories ?? []))
      .catch(() => {})
  }, [])

  async function handleSave() {
    if (!title.trim() || !description.trim() || !instructions.trim() || !duration.trim()) {
      toast({ variant: 'error', title: 'Validation error', message: 'All fields are required' })
      return
    }
    setSaving(true)
    try {
      const url = lab ? `/api/admin/labphases/${lab.id}` : '/api/admin/labphases'
      const method = lab ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, instructions, duration, image, category }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast({ variant: 'error', title: 'Failed to save', message: data.error })
        return
      }
      toast({ variant: 'success', title: lab ? 'LabPhase updated' : 'LabPhase created' })
      onSave()
      onClose()
    } catch {
      toast({ variant: 'error', title: 'Failed to save' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-black/45 grid place-items-center" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-canvas border border-hairline shadow-lg w-[520px] max-w-[calc(100vw-2rem)] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-xl py-lg border-b border-hairline">
          <h2 className="text-heading-sm text-ink font-700">{lab ? 'Edit LabPhase' : 'Create LabPhase'}</h2>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-mute hover:text-ink p-0"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-xl overflow-y-auto space-y-lg">
          <div>
            <label className="text-caption text-mute uppercase tracking-widest font-600 mb-1.5 block">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2.5 rounded-xs outline-none focus:border-ink transition-colors" />
          </div>
          <div>
            <label className="text-caption text-mute uppercase tracking-widest font-600 mb-1.5 block">Description</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2.5 rounded-xs outline-none focus:border-ink transition-colors resize-none" />
          </div>
          <div>
            <label className="text-caption text-mute uppercase tracking-widest font-600 mb-1.5 block">Instructions</label>
            <textarea rows={5} value={instructions} onChange={(e) => setInstructions(e.target.value)} className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2.5 rounded-xs outline-none focus:border-ink transition-colors resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-lg">
            <div>
              <label className="text-caption text-mute uppercase tracking-widest font-600 mb-1.5 block">Duration</label>
              <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 4 weeks" className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2.5 rounded-xs outline-none focus:border-ink transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-caption text-mute uppercase tracking-widest font-600 mb-1.5 block">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2.5 rounded-xs outline-none focus:border-ink transition-colors">
              <option value="">Select category...</option>
              {categoryOptions.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          <ImageUpload value={image} onChange={(url) => setImage(url)} />
        </div>
        <div className="flex justify-end gap-md p-xl border-t border-hairline">
          <Button variant="outline-dark" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ApproveModal({
  lab,
  onClose,
  onSave,
}: {
  lab: LabPhaseData
  onClose: () => void
  onSave: () => void
}) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAction(status: 'approved' | 'rejected') {
    if (status === 'rejected' && !rejectionReason.trim()) {
      toast({ variant: 'error', title: 'Validation error', message: 'Please provide a reason for rejection' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/labphases/${lab.id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast({ variant: 'error', title: 'Failed', message: data.error })
        return
      }
      toast({ variant: 'success', title: `LabPhase ${status === 'approved' ? 'approved' : 'rejected'}` })
      onSave()
      onClose()
    } catch {
      toast({ variant: 'error', title: 'Failed to update' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-black/45 grid place-items-center" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-canvas border border-hairline shadow-lg w-[420px] max-w-[calc(100vw-2rem)] flex flex-col">
        <div className="flex items-center justify-between px-xl py-lg border-b border-hairline">
          <h2 className="text-heading-sm text-ink font-700">Review LabPhase</h2>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-mute hover:text-ink p-0"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-xl">
          <p className="text-body-sm text-ink font-600 mb-xs">{lab.title}</p>
          <p className="text-caption text-mute mb-lg">by {lab.createdBy?.name ?? 'Unknown'}</p>
          <p className="text-body-sm text-mute mb-lg">{lab.description}</p>
          <div>
            <label className="text-caption text-mute uppercase tracking-widest font-600 mb-1.5 block">Rejection reason (required if rejecting)</label>
            <textarea rows={3} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2.5 rounded-xs outline-none focus:border-ink transition-colors resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-md p-xl border-t border-hairline">
          <Button variant="outline-dark" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => handleAction('approved')} disabled={saving}>
            <CheckCircle className="w-4 h-4 mr-1" /> Approve
          </Button>
          <Button variant="outline-dark" onClick={() => handleAction('rejected')} disabled={saving} className="!text-error !border-error">
            <XCircle className="w-4 h-4 mr-1" /> Reject
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function LabPhaseListPage() {
  const { data: session } = useSession()
  const role = session?.user?.role
  const [labphases, setLabphases] = useState<LabPhaseData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editLab, setEditLab] = useState<LabPhaseData | null>(null)
  const [approveLab, setApproveLab] = useState<LabPhaseData | null>(null)

  async function fetchLabPhases() {
    try {
      const res = await fetch('/api/admin/labphases')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setLabphases(data.labphases)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchLabPhases() }, [])

  async function handleDelete(lab: LabPhaseData) {
    if (!confirm(`Delete "${lab.title}"?`)) return
    try {
      const res = await fetch(`/api/admin/labphases/${lab.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        toast({ variant: 'error', title: 'Failed to delete', message: data.error })
        return
      }
      toast({ variant: 'success', title: 'LabPhase deleted' })
      fetchLabPhases()
    } catch {
      toast({ variant: 'error', title: 'Failed to delete' })
    }
  }

  if (loading) return <LogoSpinner />

  if (error) {
    return (
      <div className="max-w-[1440px] mx-auto px-xl py-xxl">
        <p className="text-error">{error}</p>
      </div>
    )
  }

  const canCreate = role === 'admin' || role === 'instructor'
  const canManage = role === 'admin'

  return (
    <div className="max-w-[1440px] mx-auto px-xl py-xxl">
      <div className="flex items-center justify-between mb-xxl">
        <div>
          <h1 className="text-display-md text-ink font-700 leading-[0.95]">Lab Phase List</h1>
          <p className="text-body-sm text-mute mt-sm">
            {role === 'admin' ? 'Manage all lab phases' : role === 'instructor' ? 'Create and manage your lab phases' : 'Browse approved lab phases'}
          </p>
        </div>
        <div className="flex items-center gap-md">
          <Badge variant="default">{labphases.length} Total</Badge>
          {canCreate && (
            <Button variant="primary" size="sm" onClick={() => { setEditLab(null); setShowModal(true) }}>
              <Plus className="w-4 h-4 mr-1" /> Create LabPhase
            </Button>
          )}
        </div>
      </div>

      {labphases.length === 0 ? (
        <div className="bg-canvas border border-hairline py-xxxl text-center">
          <FlaskConical className="w-10 h-10 text-mute mx-auto mb-lg" />
          <p className="text-body-md text-mute">No lab phases yet</p>
          {canCreate && (
            <Button variant="primary" size="sm" className="mt-lg" onClick={() => { setEditLab(null); setShowModal(true) }}>
              <Plus className="w-4 h-4 mr-1" /> Create the first LabPhase
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-lg">
          {labphases.map((lab, i) => {
            const config = statusConfig[lab.status] ?? statusConfig.approved
            return (
              <motion.div
                key={lab.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-canvas border border-hairline p-xxl"
              >
                <div className="flex items-start justify-between mb-lg">
                  <div className="flex items-start gap-lg flex-1 min-w-0">
                    {lab.image ? (
                      <div className="w-20 h-20 shrink-0 overflow-hidden bg-surface-soft border border-hairline">
                        <img src={lab.image} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 shrink-0 bg-surface-soft flex items-center justify-center border border-hairline">
                        <ImageIcon className="w-6 h-6 text-mute" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-md flex-wrap mb-xs">
                        <h2 className="text-heading-sm text-ink font-700">{lab.title}</h2>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </div>
                      <p className="text-body-sm text-mute">{lab.description}</p>
                      <p className="text-caption text-charcoal mt-xs">{lab.duration}{lab.category ? ` · ${lab.category}` : ''}</p>
                      {lab.status === 'rejected' && lab.rejectionReason && (
                        <p className="text-caption text-error mt-xs">Reason: {lab.rejectionReason}</p>
                      )}
                      <p className="text-caption text-mute mt-xs">Created by {lab.createdBy?.name ?? 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-lg">
                    {canManage && lab.status === 'pending' && (
                      <Button variant="primary" size="sm" onClick={() => setApproveLab(lab)}>
                        <CheckCircle className="w-4 h-4 mr-1" /> Review
                      </Button>
                    )}
                    {canManage && (
                      <button onClick={() => { setEditLab(lab); setShowModal(true) }} className="w-8 h-8 flex items-center justify-center bg-transparent border border-hairline-strong rounded-xs cursor-pointer text-charcoal hover:text-ink transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    {role === 'instructor' && lab.createdBy?.id === session?.user?.id && lab.status === 'pending' && (
                      <button onClick={() => { setEditLab(lab); setShowModal(true) }} className="w-8 h-8 flex items-center justify-center bg-transparent border border-hairline-strong rounded-xs cursor-pointer text-charcoal hover:text-ink transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    {(canManage || (role === 'instructor' && lab.createdBy?.id === session?.user?.id)) && (
                      <button onClick={() => handleDelete(lab)} className="w-8 h-8 flex items-center justify-center bg-transparent border border-hairline-strong rounded-xs cursor-pointer text-mute hover:text-error transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <details className="group">
                  <summary className="text-button-sm text-ink cursor-pointer hover:opacity-70 transition-opacity select-none">View Instructions</summary>
                  <div className="mt-md p-lg bg-surface-soft border border-hairline whitespace-pre-wrap text-body-sm text-charcoal">{lab.instructions}</div>
                </details>
              </motion.div>
            )
          })}
        </div>
      )}

      {showModal && (
        <LabPhaseModal lab={editLab} onClose={() => { setShowModal(false); setEditLab(null) }} onSave={fetchLabPhases} />
      )}

      {approveLab && (
        <ApproveModal lab={approveLab} onClose={() => setApproveLab(null)} onSave={fetchLabPhases} />
      )}
    </div>
  )
}
