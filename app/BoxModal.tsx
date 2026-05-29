'use client'

import { useState, useRef } from 'react'
import { GarazBox, BoxItem, CATEGORIES, BOX_COLORS } from '@/lib/types'

type Props = {
  box: GarazBox
  onSave: (box: GarazBox, imageFile: File | null) => Promise<void>
  onClose: () => void
}

export default function BoxModal({ box, onSave, onClose }: Props) {
  const [title, setTitle] = useState(box.title)
  const [category, setCategory] = useState(box.category)
  const [color, setColor] = useState(box.color)
  const [items, setItems] = useState<BoxItem[]>(box.items ?? [])
  const [newItem, setNewItem] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(box.image_url)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

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

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    setSaving(true)
    await onSave({ ...box, title, category, color, items }, imageFile)
    setSaving(false)
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
                <div key={idx} className={`flex items-center gap-2 rounded px-1 py-0.5 hover:bg-gray-100 ${item.checked ? 'opacity-60' : ''}`}>
                  <input type="checkbox" checked={item.checked} onChange={() => toggleItem(idx)}
                    className="w-4 h-4 flex-shrink-0 accent-green-600 cursor-pointer" />
                  <input
                    type="text" value={item.text}
                    onChange={e => updateItemText(idx, e.target.value)}
                    className={`flex-1 text-sm bg-transparent border-none outline-none ${item.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}
                  />
                  <button onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-500 text-xs px-1">✕</button>
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
    </div>
  )
}
