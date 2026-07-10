'use client'

import { useRef, useCallback, useEffect, useState } from 'react'
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Image, Video, List, ListOrdered, Palette,
} from 'lucide-react'
import { cn } from '@/lib/utils'

function encodeImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [showVideoInput, setShowVideoInput] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function focusEditor() {
    if (!editorRef.current) return
    editorRef.current.focus()
    const range = document.createRange()
    range.selectNodeContents(editorRef.current)
    range.collapse(false)
    const sel = window.getSelection()
    if (sel) {
      sel.removeAllRanges()
      sel.addRange(range)
    }
  }

  function insertHtml(html: string) {
    focusEditor()
    document.execCommand('insertHTML', false, html)
    if (editorRef.current) {
      const event = new Event('input', { bubbles: true })
      editorRef.current.dispatchEvent(event)
    }
  }

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (!value) {
        editorRef.current.innerHTML = ''
      } else if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value
      }
    }
  }, [value])

  const exec = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      editorRef.current.focus()
      const event = new Event('input', { bubbles: true })
      editorRef.current.dispatchEvent(event)
    }
  }, [])

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const insertVideo = useCallback(() => {
    if (!videoUrl.trim()) return
    let html = ''
    const url = videoUrl.trim()
    const ytMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/
    )
    if (ytMatch) {
      html = `<div style="position:relative;padding-bottom:56.25%;height:0;margin:12px 0">
<iframe src="https://www.youtube.com/embed/${ytMatch[1]}" style="position:absolute;top:0;left:0;width:100%;height:100%" frameborder="0" allowfullscreen></iframe>
</div>`
    } else {
      html = `<video src="${url}" controls style="max-width:100%;display:block;margin:12px 0"></video>`
    }
    insertHtml(html)
    setVideoUrl('')
    setShowVideoInput(false)
  }, [videoUrl])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }, [])

  return (
    <div className="border border-hairline bg-canvas">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-hairline bg-surface-soft">
        <ToolbarButton onClick={() => exec('bold')} title="Bold" icon={<Bold className="w-3.5 h-3.5" />} />
        <ToolbarButton onClick={() => exec('italic')} title="Italic" icon={<Italic className="w-3.5 h-3.5" />} />
        <ToolbarButton onClick={() => exec('underline')} title="Underline" icon={<Underline className="w-3.5 h-3.5" />} />

        <div className="w-px h-5 bg-hairline mx-1" />

        <select
          onChange={(e) => exec('fontSize', e.target.value)}
          className="h-7 border border-hairline bg-canvas text-[11px] text-ink px-1 cursor-pointer outline-none uppercase tracking-[0.08em]"
          title="Font Size"
        >
          <option value="">Size</option>
          <option value="1">Small</option>
          <option value="3">Normal</option>
          <option value="5">Large</option>
          <option value="7">X-Large</option>
        </select>

        <ToolbarButton onClick={() => setShowColorPicker(!showColorPicker)} title="Text Color" icon={<Palette className="w-3.5 h-3.5" />} />
        {showColorPicker && (
          <input
            type="color"
            onChange={(e) => { exec('foreColor', e.target.value); setShowColorPicker(false) }}
            className="w-6 h-6 p-0 border-0 cursor-pointer"
          />
        )}

        <div className="w-px h-5 bg-hairline mx-1" />

        <ToolbarButton onClick={() => exec('justifyLeft')} title="Align Left" icon={<AlignLeft className="w-3.5 h-3.5" />} />
        <ToolbarButton onClick={() => exec('justifyCenter')} title="Align Center" icon={<AlignCenter className="w-3.5 h-3.5" />} />
        <ToolbarButton onClick={() => exec('justifyRight')} title="Align Right" icon={<AlignRight className="w-3.5 h-3.5" />} />

        <div className="w-px h-5 bg-hairline mx-1" />

        <ToolbarButton onClick={() => exec('insertUnorderedList')} title="Bullet List" icon={<List className="w-3.5 h-3.5" />} />
        <ToolbarButton onClick={() => exec('insertOrderedList')} title="Numbered List" icon={<ListOrdered className="w-3.5 h-3.5" />} />

        <div className="w-px h-5 bg-hairline mx-1" />

        <ToolbarButton onClick={() => setShowImageUpload(true)} title="Insert Image" icon={<Image className="w-3.5 h-3.5" />} />
        <ToolbarButton onClick={() => setShowVideoInput(true)} title="Insert Video" icon={<Video className="w-3.5 h-3.5" />} />
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onPaste={handlePaste}
        className={cn(
          'min-h-[300px] max-h-[600px] overflow-y-auto px-4 py-3 text-body-md text-ink focus:outline-none leading-relaxed cursor-text',
          !value && isFocused === false && 'before:content-[attr(data-placeholder)] before:text-mute/50 before:pointer-events-none'
        )}
        data-placeholder={placeholder || 'Type your content here...'}
        style={{ whiteSpace: 'pre-wrap' }}
      />

      {/* Image upload modal (inline) */}
      {showImageUpload && (
        <div className="border-t border-hairline p-4 bg-surface-soft">
          <div className="flex items-center justify-between mb-3">
            <p className="text-caption text-ink uppercase tracking-[0.1em] font-600">Insert Image</p>
            <button
              onClick={() => { setShowImageUpload(false); setImagePreview(null) }}
              className="text-mute hover:text-ink bg-transparent border-none cursor-pointer text-[13px]"
            >
              Cancel
            </button>
          </div>
          <div className="border-2 border-dashed border-hairline-strong p-4 text-center">
            {imagePreview ? (
              <div>
                <img src={imagePreview} alt="" className="max-h-40 mx-auto object-contain mb-2" />
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => {
                      if (imagePreview) {
                        insertHtml(
                          `<img src="${imagePreview}" alt="" style="max-width:100%;height:auto;display:block;margin:12px 0" />`
                        )
                      }
                      setImagePreview(null)
                      setShowImageUpload(false)
                    }}
                    className="border border-ink bg-ink text-canvas text-button-sm font-bold uppercase px-3 py-1.5 cursor-pointer hover:bg-ink/90 transition-colors"
                  >
                    Insert
                  </button>
                  <button
                    onClick={() => { setImagePreview(null) }}
                    className="border border-hairline-strong bg-canvas text-ink text-button-sm font-bold uppercase px-3 py-1.5 cursor-pointer hover:bg-surface-soft transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const b64 = await encodeImageToBase64(file)
                    setImagePreview(b64)
                  }}
                />
                <Image className="w-8 h-8 text-mute mx-auto mb-1" />
                <p className="text-body-sm text-mute">Click to upload an image</p>
              </label>
            )}
          </div>
        </div>
      )}

      {/* Video URL input (inline) */}
      {showVideoInput && (
        <div className="border-t border-hairline p-4 bg-surface-soft">
          <div className="flex items-center justify-between mb-3">
            <p className="text-caption text-ink uppercase tracking-[0.1em] font-600">Insert Video</p>
            <button
              onClick={() => { setShowVideoInput(false); setVideoUrl('') }}
              className="text-mute hover:text-ink bg-transparent border-none cursor-pointer text-[13px]"
            >
              Cancel
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="YouTube URL or direct video URL..."
              className="flex-1 border border-hairline-strong bg-canvas text-ink text-body-sm px-3 py-1.5 outline-none focus:border-ink"
            />
            <button
              onClick={insertVideo}
              disabled={!videoUrl.trim()}
              className="border border-ink bg-ink text-canvas text-button-sm font-bold uppercase px-3 py-1.5 cursor-pointer hover:bg-ink/90 transition-colors disabled:opacity-40 shrink-0"
            >
              Insert
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ToolbarButton({
  onClick,
  title,
  icon,
  active,
}: {
  onClick: () => void
  title: string
  icon: React.ReactNode
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'w-7 h-7 flex items-center justify-center bg-transparent border-none cursor-pointer rounded-none transition-colors',
        active ? 'bg-ink text-canvas' : 'text-mute hover:text-ink hover:bg-canvas'
      )}
    >
      {icon}
    </button>
  )
}
