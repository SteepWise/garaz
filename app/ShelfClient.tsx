'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GarazBox, BoxItem, CATEGORY_DARK_COLORS } from '@/lib/types'
import BoxModal from './BoxModal'
import SettingsModal from './SettingsModal'
import BottomNav from './BottomNav'
import dynamic from 'next/dynamic'
const QrScannerModal = dynamic(() => import('./QrScannerModal'), { ssr: false })

type Props = {
  userId: string
  initialBoxes: GarazBox[]
  cols: number
  rows: number
  openBox?: number
}

export default function ShelfClient({ userId, initialBoxes, cols: initCols, rows: initRows, openBox }: Props) {
  const [boxes, setBoxes] = useState<GarazBox[]>(initialBoxes)
  const [cols, setCols] = useState(initCols)
  const [rows, setRows] = useState(initRows)
  const [editingBox, setEditingBox] = useState<GarazBox | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [activeCategory, setActiveCategory] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (openBox === undefined) return
    const box = initialBoxes.find(b => b.position === openBox)
    if (box) setEditingBox(box)
  }, [])

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

    console.log('[garaz] save payload:', JSON.stringify(payload))

    if (box.id) {
      const { data, error } = await supabase.from('garaz_boxes').update(payload).eq('id', box.id).select().single()
      if (error) {
        console.error('[garaz] update error:', error)
        throw new Error('Uložení selhalo: ' + error.message + (error.details ? ' | ' + error.details : ''))
      }
      if (data) setBoxes(prev => prev.map(b => b.position === box.position ? data : b))
    } else {
      const { data, error } = await supabase.from('garaz_boxes').insert(payload).select().single()
      if (error) {
        console.error('[garaz] insert error:', error)
        throw new Error('Uložení selhalo: ' + error.message + (error.details ? ' | ' + error.details : ''))
      }
      if (data) setBoxes(prev => prev.map(b => b.position === box.position ? data : b))
    }
    setEditingBox(null)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  async function handleGridChange(newCols: number, newRows: number) {
    const total = newCols * newRows
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
      const beyond = prev.filter(b => b.position >= total && b.id !== null)
      return [...filled, ...beyond]
    })
    setShowSettings(false)
  }

  const visibleBoxes = boxes.filter(b => b.position < cols * rows)
  const filteredBoxes = activeCategory
    ? visibleBoxes.filter(b => b.category === activeCategory)
    : visibleBoxes

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: 'var(--bg-nav)',
        borderBottom: '1px solid #222',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 22,
          fontWeight: 700,
          color: '#ff6b35',
          letterSpacing: 2,
          textTransform: 'uppercase',
          margin: 0,
          flex: 1,
        }}>
          ⬡ Digitální Regál
        </h1>
        {activeCategory && (
          <span style={{
            fontSize: 12,
            color: '#aaa',
            background: 'var(--bg-surface)',
            padding: '4px 10px',
            borderRadius: 12,
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            {activeCategory}
            <button
              onClick={() => setActiveCategory('')}
              style={{ color: '#ff6b35', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, padding: 0, lineHeight: 1 }}
            >✕</button>
          </span>
        )}
      </div>

      {/* Grid beden */}
      <div style={{ padding: 14, display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 }}>
        {filteredBoxes.map(box => {
          const colors = CATEGORY_DARK_COLORS[box.category]
          const borderColor = colors ? colors.border : 'var(--border-subtle)'
          const labelColor = colors ? colors.label : 'var(--text-muted)'
          const hasItems = (box.items?.length ?? 0) > 0
          const ownedCount = box.items?.filter((it: BoxItem) => !it.checked).length ?? 0
          const totalCount = box.items?.length ?? 0
          const allOwned = hasItems && ownedCount === totalCount
          const preview = box.items?.slice(0, 3) ?? []
          const isEmpty = !box.id

          return (
            <div
              key={box.position}
              onClick={() => router.push(`/box/${box.position}`)}
              style={{
                background: isEmpty ? 'transparent' : 'var(--bg-surface)',
                border: isEmpty ? '1px dashed #2a2a2a' : `2px solid ${borderColor}`,
                borderRadius: 8,
                padding: 12,
                minHeight: 120,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                WebkitTapHighlightColor: 'transparent',
                transition: 'opacity 0.1s',
              }}
            >
              {isEmpty ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a2a2a', fontSize: 28, fontWeight: 300 }}>
                  +
                </div>
              ) : (
                <>
                  {box.category && (
                    <span style={{ color: labelColor, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>
                      {box.category}
                    </span>
                  )}
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 7,
                    letterSpacing: 0.5,
                    lineHeight: 1.2,
                  }}>
                    {box.title || `Bedna ${box.position + 1}`}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    {preview.map((item: BoxItem, idx: number) => (
                      <div key={idx} style={{
                        fontSize: 12,
                        color: item.checked ? '#333' : '#999',
                        display: 'flex',
                        gap: 5,
                        lineHeight: 1.6,
                        alignItems: 'baseline',
                      }}>
                        <span style={{ color: item.checked ? '#333' : '#4ecdc4', fontSize: 10, flexShrink: 0 }}>
                          {item.checked ? '☐' : '☑'}
                        </span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                    {box.items?.length > 3 && (
                      <div style={{ fontSize: 10, color: '#3a3a3a', marginTop: 2 }}>
                        +{box.items.length - 3} dalších
                      </div>
                    )}
                  </div>
                  {hasItems && (
                    <div style={{
                      position: 'absolute', bottom: 8, right: 10,
                      fontSize: 10, fontWeight: 700,
                      color: allOwned ? '#4ecdc4' : '#ff6b35',
                      fontFamily: "'Courier New', monospace",
                    }}>
                      {ownedCount}/{totalCount}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      {editingBox && (
        <BoxModal box={editingBox} userId={userId} onSave={handleSave} onClose={() => setEditingBox(null)} />
      )}
      {showSettings && (
        <SettingsModal cols={cols} rows={rows} onSave={handleGridChange} onClose={() => setShowSettings(false)} onLogout={handleLogout} />
      )}
      {showScanner && <QrScannerModal onClose={() => setShowScanner(false)} />}

      <BottomNav
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        onScanClick={() => setShowScanner(true)}
        onSettingsClick={() => setShowSettings(true)}
      />
    </div>
  )
}
