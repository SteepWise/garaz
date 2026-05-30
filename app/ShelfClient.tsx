'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GarazBox, BoxItem, CATEGORY_COLORS, CATEGORIES, BOX_COLORS } from '@/lib/types'
import BoxModal from './BoxModal'
import SettingsModal from './SettingsModal'

type Props = {
  userId: string
  initialBoxes: GarazBox[]
  cols: number
  rows: number
}

export default function ShelfClient({ userId, initialBoxes, cols: initCols, rows: initRows }: Props) {
  const [boxes, setBoxes] = useState<GarazBox[]>(initialBoxes)
  const [cols, setCols] = useState(initCols)
  const [rows, setRows] = useState(initRows)
  const [editingBox, setEditingBox] = useState<GarazBox | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const supabase = createClient()

  async function handleSave(box: GarazBox, imageFile: File | null) {
    let image_url = box.image_url

    if (imageFile) {
      const path = `${userId}/${box.position}-${Date.now()}`
      const { data: upload, error: uploadError } = await supabase.storage
        .from('garaz_photos')
        .upload(path, imageFile, { upsert: true })
      if (uploadError) throw new Error('Nahrání fotky selhalo: ' + uploadError.message)
      const { data: { publicUrl } } = supabase.storage.from('garaz_photos').getPublicUrl(upload.path)
      image_url = publicUrl
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created_at, updated_at, ...rest } = box
    const payload = { ...rest, image_url, user_id: userId }

    if (box.id) {
      const { data, error } = await supabase.from('garaz_boxes').update(payload).eq('id', box.id).select().single()
      if (error) throw new Error('Uložení selhalo: ' + error.message)
      if (data) setBoxes(prev => prev.map(b => b.position === box.position ? data : b))
    } else {
      const { data, error } = await supabase.from('garaz_boxes').insert(payload).select().single()
      if (error) throw new Error('Uložení selhalo: ' + error.message)
      if (data) setBoxes(prev => prev.map(b => b.position === box.position ? data : b))
    }
    setEditingBox(null)
  }

  async function handleGridChange(newCols: number, newRows: number) {
    const total = newCols * newRows
    const currentTotal = cols * rows
    if (total < currentTotal) {
      await supabase.from('garaz_boxes').delete().eq('user_id', userId).gte('position', total)
    }
    await supabase.from('garaz_settings').upsert({ user_id: userId, cols: newCols, rows: newRows })
    setCols(newCols)
    setRows(newRows)
    setBoxes(prev => {
      const filled = Array.from({ length: total }, (_, i) => {
        const existing = prev.find(b => b.position === i)
        return existing ?? {
          id: null, user_id: userId, position: i,
          title: `Bedna ${i + 1}`, category: '', items: [], color: '#ffffff', image_url: null,
          created_at: '', updated_at: '',
        }
      })
      return filled
    })
    setShowSettings(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] p-4 md:p-6">
      {/* Hlavička */}
      <div className="max-w-6xl mx-auto mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-800 flex-1">📦 Digitální Regál</h1>
        <button
          onClick={() => setShowSettings(true)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >⚙️ Nastavení</button>
        <button
          onClick={handleLogout}
          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 transition"
        >Odhlásit</button>
      </div>

      {/* Regál */}
      <div
        className="max-w-6xl mx-auto rounded-xl p-4 shadow-2xl"
        style={{ background: '#8B5A2B', display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '12px' }}
      >
        {boxes.map(box => {
          const catColor = CATEGORY_COLORS[box.category] || '#ffffff'
          const borderColor = box.color !== '#ffffff' ? box.color : '#ccc'
          const hasItems = box.items?.length > 0
          const checkedCount = box.items?.filter((it: BoxItem) => it.checked).length ?? 0
          const preview = box.items?.slice(0, 4) ?? []

          return (
            <div
              key={box.position}
              onClick={() => setEditingBox(box)}
              className="rounded-md cursor-pointer transition-transform hover:scale-[1.02] relative flex flex-col p-2.5 min-h-[140px]"
              style={{ background: catColor || '#fff', border: `3px solid ${borderColor}` }}
            >
              {box.category && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/[0.08] text-gray-600 self-start mb-1 truncate max-w-full">
                  {box.category}
                </span>
              )}
              <div className="font-bold text-[13px] text-center border-b border-black/10 pb-1 mb-1.5 truncate">
                {box.title || `Bedna ${box.position + 1}`}
              </div>
              <div className="flex-1 overflow-hidden">
                {preview.map((item: BoxItem, idx: number) => (
                  <div key={idx} className={`text-[11px] flex items-center gap-1 leading-[1.3] ${item.checked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    <span className="text-[9px]">{item.checked ? '☑' : '☐'}</span>
                    <span className="truncate">{item.text}</span>
                  </div>
                ))}
                {box.items?.length > 4 && (
                  <div className="text-[10px] text-gray-400 mt-0.5">+{box.items.length - 4} dalších</div>
                )}
              </div>
              {box.image_url && (
                <img src={box.image_url} alt="" className="w-full h-12 object-cover rounded mt-1.5" />
              )}
              {hasItems && (
                <div className="absolute bottom-1.5 right-1.5 text-[10px] text-gray-400">
                  {checkedCount}/{box.items.length}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {editingBox && (
        <BoxModal
          box={editingBox}
          onSave={handleSave}
          onClose={() => setEditingBox(null)}
        />
      )}

      {showSettings && (
        <SettingsModal
          cols={cols} rows={rows}
          onSave={handleGridChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
