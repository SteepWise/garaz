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

  async function handleItemConfirm(idx: number, updated: BoxItem) {
    const newItems = items.map((it, i) => i === idx ? updated : it)
    console.log('[garaz] handleItemConfirm idx:', idx, 'updated:', JSON.stringify(updated), 'newItems:', JSON.stringify(newItems))
    setItems(newItems)
    setEditingItemIdx(null)
    setSaving(true)
    setSaveError(null)
    try {
      await onSave({ ...box, title, category, color, items: newItems }, imageFile)
      console.log('[garaz] auto-save OK')
    } catch (err) {
      console.error('[garaz] auto-save FAIL:', err)
      setSaveError(err instanceof Error ? err.message : 'Nastala chyba při ukládání.')
    } finally {
      setSaving(false)
    }
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
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="rounded-xl w-full max-w-md max-h-[92vh] overflow-y-auto" style={{ background: 'var(--bg-elevated)', border: '1px solid #444', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}>
        <div className="p-6">
          <h2 className="font-bold mb-4" style={{ color: '#ff6b35', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, textTransform: 'uppercase', fontSize: 18 }}>Upravit bednu</h2>

          {/* Název */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Název</label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)} maxLength={60}
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ background: '#1a1a1a', border: '1px solid #444', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Kategorie */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Kategorie</label>
            <select
              value={category} onChange={e => setCategory(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ background: '#1a1a1a', border: '1px solid #444', color: 'var(--text-primary)' }}
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Obsah / položky */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Obsah bedny</label>
            <div className="rounded-lg max-h-48 overflow-y-auto p-2 mb-2 space-y-1" style={{ background: '#1a1a1a', border: '1px solid #333' }}>
              {items.length === 0 && <p className="text-xs py-1" style={{ color: 'var(--text-muted)' }}>Zatím žádné položky.</p>}
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 rounded px-2 py-1.5 ${item.checked ? 'opacity-40' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleItem(idx)}
                    className="w-4 h-4 flex-shrink-0 accent-green-600 cursor-pointer"
                  />
                  <span
                    onClick={() => setEditingItemIdx(idx)}
                    className={`flex-1 text-sm cursor-pointer select-none ${item.checked ? 'line-through' : ''}`} style={{ color: item.checked ? 'var(--text-muted)' : 'var(--text-primary)' }}
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
                  <button onClick={() => removeItem(idx)} className="text-xs px-1 flex-shrink-0 transition-colors" style={{ color: '#444' }} onMouseEnter={e => (e.currentTarget.style.color = '#ff6b6b')} onMouseLeave={e => (e.currentTarget.style.color = '#444')}>✕</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text" value={newItem} onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addItem()}
                placeholder="Nová položka... (Enter)"
                className="flex-1 rounded-lg px-3 py-1.5 text-sm focus:outline-none" style={{ background: '#1a1a1a', border: '1px solid #444', color: 'var(--text-primary)' }}
              />
              <button onClick={addItem}
                className="px-4 py-1.5 rounded-lg text-lg font-bold transition" style={{ background: '#1f4a1f', color: '#4ecdc4', border: '1px solid #2d6a4f' }}>+</button>
            </div>
          </div>

          {/* Barva */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Barva bedny</label>
            <div className="flex gap-2 flex-wrap">
              {BOX_COLORS.map(c => (
                <button
                  key={c.value} onClick={() => setColor(c.value)} title={c.label}
                  className={`w-8 h-8 rounded-full transition ${color === c.value ? 'scale-110' : ''}`}
                  style={{ background: c.value, border: color === c.value ? '2px solid #ff6b35' : '2px solid #333' }}
                />
              ))}
            </div>
          </div>

          {/* Fotka */}
          <div className="mb-5">
            <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Fotografie</label>
            {imagePreview && (
              <div className="mb-2 relative">
                <img src={imagePreview} alt="náhled" className="w-full h-36 object-cover rounded-lg" />
                <button
                  onClick={() => { setImagePreview(null); setImageFile(null) }}
                  className="absolute top-1 right-1 text-white text-xs px-2 py-0.5 rounded" style={{ background: '#8b2020' }}
                >Odstranit</button>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              className="px-4 py-2 rounded-lg text-sm transition" style={{ background: '#1e1e1e', border: '1px solid #444', color: 'var(--text-secondary)' }}
            >📷 {imagePreview ? 'Změnit fotku' : 'Přidat fotku'}</button>
          </div>

          {/* QR kód */}
          <div className="mb-5">
            <button
              onClick={() => setShowQr(v => !v)}
              className="flex items-center gap-2 text-sm font-semibold transition" style={{ color: 'var(--text-secondary)' }}
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
                  className="px-4 py-1.5 rounded-lg text-sm transition" style={{ background: '#1e1e1e', border: '1px solid #444', color: 'var(--text-secondary)' }}
                >⬇ Stáhnout PNG</button>
              </div>
            )}
          </div>

          {saveError && (
            <p className="text-sm rounded-lg px-3 py-2 mb-3" style={{ color: '#ff6b6b', background: '#2a1010', border: '1px solid #8b2020' }}>⚠️ {saveError}</p>
          )}

          {/* Tlačítka */}
          <div className="flex justify-end gap-3">
            <button onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm font-medium transition" style={{ background: '#1e1e1e', color: 'var(--text-secondary)', border: '1px solid #333' }}>
              Zrušit
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-40" style={{ background: '#ff6b35', color: '#111' }}>
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
