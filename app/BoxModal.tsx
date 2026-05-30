'use client'

import { useState, useRef } from 'react'
import { GarazBox, BoxItem, CATEGORIES, BOX_COLORS } from '@/lib/types'
import { compressImage } from '@/lib/compressImage'
import ItemEditModal from './ItemEditModal'
import { QRCodeCanvas } from 'qrcode.react'

type Props = {
  box: GarazBox
  userId: string
  onSave: (box: GarazBox, imageFile: File | null) => Promise<void>
  onClose: () => void
}

export default function BoxModal({ box, userId, onSave, onClose }: Props) {
  const [title, setTitle] = useState(box.title)
  const [category, setCategory] = useState(box.category)
  const [color, setColor] = useState(box.color)
  const [items, setItems] = useState<BoxItem[]>(box.items ?? [])
  const [newItem, setNewItem] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(box.image_url)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [showQr, setShowQr] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const qrRef = useRef<HTMLDivElement>(null)

  function addItem() {
    const text = newItem.trim()
    if (!text) return
    setItems(prev => [...prev, { text, checked: false }])
    setNewItem('')
  }

  function toggleItem(idx: number) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, checked: !it.checked } : it))
  }

  function updateItemText(idx: number, text: string) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, text } : it))
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function handleItemConfirm(idx: number, updated: BoxItem) {
    setItems(prev => prev.map((it, i) => i === idx ? updated : it))
    setEditingItemIdx(null)
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressImage(file)
    setImageFile(compressed)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(compressed)
  }

  function downloadQr() {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `bedna-${box.position + 1}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      await onSave({ ...box, title, category, color, items }, imageFile)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Nastala chyba při ukládání.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Upravit bednu</h2>

          {/* Název */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Název</label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)} maxLength={60}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Kategorie */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Kategorie</label>
            <select
              value={category} onChange={e => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Obsah / položky */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Obsah bedny</label>
            <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto p-2 mb-2 space-y-1 bg-gray-50">
              {items.length === 0 && <p className="text-xs text-gray-400 py-1">Zatím žádné položky.</p>}
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 rounded px-1 py-0.5 hover:bg-gray-100 ${item.checked ? 'opacity-60' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleItem(idx)}
                    className="w-4 h-4 flex-shrink-0 accent-green-600 cursor-pointer"
                  />
                  <span
                    onClick={() => setEditingItemIdx(idx)}
                    className={`flex-1 text-sm cursor-pointer select-none ${item.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}
                  >
                    {item.text}
                  </span>
                  {item.image_url && (
                    <button
                      onClick={e => { e.stopPropagation(); setLightboxUrl(item.image_url!) }}
                      className="text-base leading-none opacity-60 hover:opacity-100 transition flex-shrink-0"
                      title="Zobrazit fotku"
                    >📷</button>
                  )}
                  <button onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-500 text-xs px-1 flex-shrink-0">✕</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text" value={newItem} onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addItem()}
                placeholder="Nová položka... (Enter)"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button onClick={addItem}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-lg font-bold transition">+</button>
            </div>
          </div>

          {/* Barva */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Barva bedny</label>
            <div className="flex gap-2 flex-wrap">
              {BOX_COLORS.map(c => (
                <button
                  key={c.value} onClick={() => setColor(c.value)} title={c.label}
                  className={`w-8 h-8 rounded-full border-2 transition ${color === c.value ? 'border-amber-600 scale-110' : 'border-gray-300'}`}
                  style={{ background: c.value }}
                />
              ))}
            </div>
          </div>

          {/* Fotka */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Fotografie</label>
            {imagePreview && (
              <div className="mb-2 relative">
                <img src={imagePreview} alt="náhled" className="w-full h-36 object-cover rounded-lg" />
                <button
                  onClick={() => { setImagePreview(null); setImageFile(null) }}
                  className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded"
                >Odstranit</button>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
            >📷 {imagePreview ? 'Změnit fotku' : 'Přidat fotku'}</button>
          </div>

          {/* QR kód */}
          <div className="mb-5">
            <button
              onClick={() => setShowQr(v => !v)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-amber-700 transition"
            >
              <span>🔲 QR kód bedny</span>
              <span className="text-gray-400 text-xs">{showQr ? '▲' : '▼'}</span>
            </button>
            {showQr && (
              <div className="mt-3 flex flex-col items-center gap-3">
                <div ref={qrRef}>
                  <QRCodeCanvas
                    value={typeof window !== 'undefined' ? `${window.location.origin}/box/${box.position}` : `/box/${box.position}`}
                    size={180}
                    includeMargin
                  />
                </div>
                <button
                  onClick={downloadQr}
                  className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                >⬇ Stáhnout PNG</button>
              </div>
            )}
          </div>

          {saveError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">⚠️ {saveError}</p>
          )}

          {/* Tlačítka */}
          <div className="flex justify-end gap-3">
            <button onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition">
              Zrušit
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50">
              {saving ? 'Ukládám...' : 'Uložit'}
            </button>
          </div>
        </div>
      </div>

        {editingItemIdx !== null && (
          <ItemEditModal
            item={items[editingItemIdx]}
            itemIndex={editingItemIdx}
            boxPosition={box.position}
            userId={userId}
            onConfirm={updated => handleItemConfirm(editingItemIdx, updated)}
            onClose={() => setEditingItemIdx(null)}
          />
        )}

        {lightboxUrl && (
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-[70]"
            onClick={() => setLightboxUrl(null)}
          >
            <div className="overflow-auto max-w-full max-h-full p-4" style={{ touchAction: 'pinch-zoom' }}>
              <img
                src={lightboxUrl}
                alt="fotka položky"
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>
        )}
    </div>
  )
}
