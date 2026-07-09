'use client'

import { useRef, useState, type DragEvent } from 'react'
import Image from 'next/image'
import { Upload, X, Trash2 } from 'lucide-react'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  onFile?: (base64: string) => void
  aspectRatio?: string
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  onFile,
  aspectRatio = 'aspect-[16/9]',
  className = '',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState(value)

  function encodeFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    const b64 = await encodeFile(file)
    setPreview(b64)
    if (onFile) onFile(b64)
    onChange(b64)
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function handleRemove() {
    setPreview('')
    onChange('')
  }

  const showPreview = preview || value

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-caption text-mute uppercase tracking-[0.1em] font-600 block">
        Cover Image
      </label>

      {showPreview ? (
        <div className={`relative w-full ${aspectRatio} overflow-hidden bg-surface-soft border border-hairline group`}>
          <Image
            src={showPreview}
            alt="Cover"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="opacity-0 group-hover:opacity-100 bg-canvas text-ink text-caption font-bold uppercase tracking-[0.1em] px-3 py-1.5 border border-hairline-strong rounded-[2px] cursor-pointer hover:bg-surface-soft transition-all"
            >
              Change
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="opacity-0 group-hover:opacity-100 bg-error text-on-dark text-caption font-bold uppercase tracking-[0.1em] px-3 py-1.5 border-none rounded-[2px] cursor-pointer hover:opacity-90 transition-all"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative w-full ${aspectRatio} border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer ${
            dragging
              ? 'border-ink bg-surface-soft'
              : 'border-hairline-strong bg-canvas hover:bg-surface-soft'
          }`}
        >
          <Upload className="w-8 h-8 text-mute" />
          <p className="text-body-sm text-mute">
            Drag & drop or click to upload
          </p>
          <p className="text-caption text-charcoal">PNG, JPG, WebP</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-hairline" />
        <span className="text-caption text-ash uppercase tracking-[0.1em]">or paste URL</span>
        <div className="flex-1 h-px bg-hairline" />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            if (!e.target.value.startsWith('data:')) setPreview(e.target.value)
          }}
          placeholder="/images/cover.png"
          className="flex-1 border border-hairline-strong bg-canvas text-ink text-body-sm px-3 py-1.5 rounded-[2px] outline-none focus:border-ink"
        />
        {value && (
          <button
            type="button"
            onClick={() => { onChange(''); setPreview('') }}
            className="text-mute hover:text-error bg-transparent border-none cursor-pointer p-1 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}