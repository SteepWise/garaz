'use client'

import { useState, useRef } from 'react'
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
  const supabase = createClient()

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
      let image_url = removePhoto ? undefined : item.image_url
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="p-5">
          <h3 className="text-base font-bold text-gray-800 mb-4">Upravit položku</h3>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Text</label>
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              maxLength={120}
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Fotografie</label>
            {imagePreview && !removePhoto ? (
              <div className="mb-2 relative">
                <img src={imagePreview} alt="náhled" className="w-full h-32 object-cover rounded-lg" />
                <button
                  onClick={() => { setRemovePhoto(true); setImagePreview(null); setImageFile(null) }}
                  className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded"
                >Odstranit</button>
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
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              📷 {imagePreview && !removePhoto ? 'Změnit fotku' : 'Přidat fotku'}
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">⚠️ {error}</p>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
            >Zrušit</button>
            <button
              onClick={handleConfirm}
              disabled={saving || !text.trim()}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
            >{saving ? 'Nahrávám...' : 'Potvrdit'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
