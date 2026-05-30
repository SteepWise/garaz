'use client'

import { useState, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BoxItem } from '@/lib/types'
import { compressImage } from '@/lib/compressImage'

type Props = {
  item: BoxItem
  itemIndex: number
  boxPosition: number
  userId: string
  onConfirm: (item: BoxItem) => void
  onClose: () => void
}

export default function ItemEditModal({ item, itemIndex, boxPosition, userId, onConfirm, onClose }: Props) {
  const [text, setText] = useState(item.text)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(item.image_url ?? null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = useMemo(() => createClient(), [])

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressImage(file)
    setImageFile(compressed)
    setRemovePhoto(false)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(compressed)
  }

  async function handleConfirm() {
    const trimmed = text.trim()
    if (!trimmed) return
    setSaving(true)
    setError(null)
    try {
      let image_url: string | null | undefined = removePhoto ? null : item.image_url
      if (imageFile) {
        const path = `${userId}/items/${boxPosition}-${itemIndex}-${Date.now()}.jpg`
        const { data: upload, error: uploadError } = await supabase.storage
          .from('garaz_photos')
          .upload(path, imageFile, { upsert: true })
        if (uploadError) throw new Error('Nahrání fotky selhalo: ' + uploadError.message)
        const { data: { publicUrl } } = supabase.storage.from('garaz_photos').getPublicUrl(upload.path)
        image_url = publicUrl
      }
      onConfirm({ ...item, text: trimmed, image_url })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nastala chyba.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[60] p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}
    >
      <div
        className="rounded-xl w-full max-w-sm"
        style={{ background: 'var(--bg-elevated)', border: '1px solid #444', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5">
          <h3
            className="font-bold mb-4"
            style={{ color: '#ff6b35', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, letterSpacing: 1, textTransform: 'uppercase' }}
          >
            Upravit položku
          </h3>

          <div className="mb-4">
            <label
              htmlFor="item-text"
              className="block text-sm font-semibold mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Text
            </label>
            <input
              id="item-text"
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              maxLength={120}
              autoFocus
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={{ background: '#1a1a1a', border: '1px solid #444', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="mb-5">
            <label
              className="block text-sm font-semibold mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Fotografie
            </label>
            {imagePreview && !removePhoto ? (
              <div className="mb-2 relative">
                <img src={imagePreview} alt="náhled" className="w-full h-32 object-cover rounded-lg" style={{ border: '1px solid #333' }} />
                <button
                  onClick={() => { setRemovePhoto(true); setImagePreview(null); setImageFile(null) }}
                  className="absolute top-1 right-1 text-white text-xs px-2 py-0.5 rounded"
                  style={{ background: '#8b2020' }}
                >
                  Odstranit
                </button>
              </div>
            ) : null}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="px-4 py-2 rounded-lg text-sm transition"
              style={{ background: '#1e1e1e', border: '1px solid #444', color: 'var(--text-secondary)' }}
            >
              📷 {imagePreview && !removePhoto ? 'Změnit fotku' : 'Přidat fotku'}
            </button>
          </div>

          {error && (
            <p className="text-sm rounded-lg px-3 py-2 mb-3" style={{ color: '#ff6b6b', background: '#2a1010', border: '1px solid #8b2020' }}>
              ⚠️ {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm font-medium transition"
              style={{ background: '#1e1e1e', color: 'var(--text-secondary)', border: '1px solid #333' }}
            >
              Zrušit
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving || !text.trim()}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-40"
              style={{ background: '#ff6b35', color: '#111' }}
            >
              {saving ? 'Nahrávám...' : 'Potvrdit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
