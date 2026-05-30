# Garáž App — Vizuální Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Přepracovat celý vizuální styl appky na industriální dark theme s oranžovými akcenty, spodní navigační lištou a filtry kategorií, optimalizovaný pro tablet.

**Architecture:** Čistě vizuální změny — žádné úpravy databázové logiky ani API. Nová komponenta `BottomNav` nahradí stávající tlačítka v hlavičce. Filtrování kategorií bude čistě frontendové (state v ShelfClient). CSS custom properties v globals.css definují celou paletu.

**Tech Stack:** Next.js App Router, Tailwind CSS v4, inline styles (pro dynamické barvy kategorií), Google Fonts (Barlow Condensed)

---

## Přehled souborů

| Soubor | Akce |
|--------|------|
| `app/globals.css` | Přidat CSS custom properties + dark body |
| `app/layout.tsx` | Přidat Google Fonts link |
| `lib/types.ts` | Přidat `CATEGORY_DARK_COLORS` |
| `app/BottomNav.tsx` | Vytvořit novou komponentu |
| `app/ShelfClient.tsx` | Přepracovat UI — dark cards, BottomNav, filtry |
| `app/BoxModal.tsx` | Dark theme |
| `app/ItemEditModal.tsx` | Dark theme |
| `app/SettingsModal.tsx` | Dark theme |
| `app/box/[position]/page.tsx` | Dark theme |
| `app/login/page.tsx` | Dark theme |
| `app/register/page.tsx` | Dark theme |

---

## Task 1: CSS Foundation + Google Fonts

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] **Krok 1: Aktualizovat globals.css**

Nahradit celý obsah `app/globals.css`:

```css
@import "tailwindcss";

:root {
  --bg-base: #111111;
  --bg-surface: #1e1e1e;
  --bg-elevated: #2a2a2a;
  --border-subtle: #333333;
  --accent: #ff6b35;
  --accent-dim: #7a3215;
  --text-primary: #eeeeee;
  --text-secondary: #888888;
  --text-muted: #444444;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg-base);
  color: var(--text-primary);
}
```

- [ ] **Krok 2: Přidat Google Fonts do layout.tsx**

Nahradit celý soubor `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digitální Regál",
  description: "Organizujte svůj sklad a garáž",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full">
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
          }
        `}} />
      </body>
    </html>
  );
}
```

- [ ] **Krok 3: Build check**

```bash
npm run build
```

Očekávaný výstup: úspěšný build bez chyb.

- [ ] **Krok 4: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat: add dark theme CSS variables and Barlow Condensed font"
```

---

## Task 2: CATEGORY_DARK_COLORS

**Files:**
- Modify: `lib/types.ts`

- [ ] **Krok 1: Přidat CATEGORY_DARK_COLORS do lib/types.ts**

Přidat na konec souboru `lib/types.ts` (za existující exporty):

```ts
export const CATEGORY_DARK_COLORS: Record<string, { border: string; label: string }> = {
  '🔧 Nářadí':             { border: '#b8860b', label: '#ffd700' },
  '⚡ Elektro':            { border: '#1a6b8a', label: '#4ecdc4' },
  '🌱 Zahrada':            { border: '#2d6a4f', label: '#74c69d' },
  '🚗 Auto':               { border: '#8b2020', label: '#ff6b6b' },
  '🏠 Domácnost':          { border: '#5a4a78', label: '#c084fc' },
  '🎨 Malování':           { border: '#7a3060', label: '#f9a8d4' },
  '🔩 Spojovací materiál': { border: '#7a6020', label: '#fbbf24' },
  '📦 Různé':              { border: '#444444', label: '#aaaaaa' },
}
```

- [ ] **Krok 2: Build check**

```bash
npm run build
```

Očekávaný výstup: úspěšný build.

- [ ] **Krok 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add CATEGORY_DARK_COLORS for dark theme"
```

---

## Task 3: BottomNav komponenta

**Files:**
- Create: `app/BottomNav.tsx`

- [ ] **Krok 1: Vytvořit app/BottomNav.tsx**

```tsx
'use client'

import { useState } from 'react'
import { CATEGORIES } from '@/lib/types'

type Props = {
  activeCategory: string
  onCategoryChange: (cat: string) => void
  onScanClick: () => void
  onSettingsClick: () => void
}

const ALL_CATS = CATEGORIES.filter(c => c.value)
const VISIBLE_CATS = ALL_CATS.slice(0, 5)
const OVERFLOW_CATS = ALL_CATS.slice(5)

export default function BottomNav({ activeCategory, onCategoryChange, onScanClick, onSettingsClick }: Props) {
  const [showOverflow, setShowOverflow] = useState(false)

  const navItemStyle = (active: boolean): React.CSSProperties => ({
    flex: '0 0 auto',
    minWidth: 52,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    background: 'none',
    border: 'none',
    borderTop: active ? '2px solid #ff6b35' : '2px solid transparent',
    cursor: 'pointer',
    color: active ? '#ff6b35' : '#555',
    padding: '6px 4px',
    marginTop: -2,
    WebkitTapHighlightColor: 'transparent',
  })

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#0d0d0d', borderTop: '2px solid #ff6b35',
      zIndex: 50, height: 60,
      display: 'flex', alignItems: 'stretch',
      overflowX: 'auto', overflowY: 'visible',
    }}>
      {/* Vše */}
      <button
        onClick={() => { onCategoryChange(''); setShowOverflow(false) }}
        style={navItemStyle(activeCategory === '')}
      >
        <span style={{ fontSize: 18 }}>📦</span>
        <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Vše</span>
      </button>

      {/* Viditelné kategorie */}
      {VISIBLE_CATS.map(cat => (
        <button
          key={cat.value}
          onClick={() => { onCategoryChange(cat.value); setShowOverflow(false) }}
          style={{ ...navItemStyle(activeCategory === cat.value), flex: '1 1 0' }}
        >
          <span style={{ fontSize: 16 }}>{cat.value.split(' ')[0]}</span>
          <span style={{ fontSize: 7, letterSpacing: 0.5 }}>
            {cat.label.replace(/^[^ ]+ /, '').substring(0, 8)}
          </span>
        </button>
      ))}

      {/* Overflow dropdown */}
      {OVERFLOW_CATS.length > 0 && (
        <div style={{ position: 'relative', flex: '0 0 auto', minWidth: 44, display: 'flex' }}>
          {showOverflow && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 59 }}
                onClick={() => setShowOverflow(false)}
              />
              <div style={{
                position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                background: '#1e1e1e', border: '1px solid #333', borderRadius: 8,
                padding: 6, minWidth: 160, zIndex: 60, marginBottom: 4,
                boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
              }}>
                {OVERFLOW_CATS.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => { onCategoryChange(cat.value); setShowOverflow(false) }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '10px 12px', background: activeCategory === cat.value ? '#2a2a2a' : 'none',
                      border: 'none', borderRadius: 4,
                      color: activeCategory === cat.value ? '#ff6b35' : '#aaa',
                      cursor: 'pointer', fontSize: 13,
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </>
          )}
          <button
            onClick={() => setShowOverflow(v => !v)}
            style={{
              ...navItemStyle(OVERFLOW_CATS.some(c => c.value === activeCategory)),
              width: '100%',
            }}
          >
            <span style={{ fontSize: 14, letterSpacing: 2 }}>···</span>
          </button>
        </div>
      )}

      <div style={{ flex: 1, minWidth: 8 }} />

      {/* Skenovat */}
      <button
        onClick={() => { onScanClick(); setShowOverflow(false) }}
        style={navItemStyle(false)}
      >
        <span style={{ fontSize: 18 }}>📷</span>
        <span style={{ fontSize: 7, letterSpacing: 0.5, textTransform: 'uppercase' }}>Sken</span>
      </button>

      {/* Nastavení */}
      <button
        onClick={() => { onSettingsClick(); setShowOverflow(false) }}
        style={navItemStyle(false)}
      >
        <span style={{ fontSize: 18 }}>⚙</span>
        <span style={{ fontSize: 7, letterSpacing: 0.5, textTransform: 'uppercase' }}>Nastav.</span>
      </button>
    </nav>
  )
}
```

- [ ] **Krok 2: Build check**

```bash
npm run build
```

Očekávaný výstup: úspěšný build, žádné TypeScript chyby.

- [ ] **Krok 3: Commit**

```bash
git add app/BottomNav.tsx
git commit -m "feat: add BottomNav component with category filtering and overflow popover"
```

---

## Task 4: ShelfClient — dark theme + BottomNav + filtry

**Files:**
- Modify: `app/ShelfClient.tsx`

- [ ] **Krok 1: Přepsat app/ShelfClient.tsx**

Nahradit celý soubor:

```tsx
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
        background: '#0d0d0d',
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
            background: '#1e1e1e',
            padding: '4px 10px',
            borderRadius: 12,
            border: '1px solid #333',
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
      <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {filteredBoxes.map(box => {
          const colors = CATEGORY_DARK_COLORS[box.category]
          const borderColor = colors ? colors.border : '#333'
          const labelColor = colors ? colors.label : '#666'
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
```

- [ ] **Krok 2: Build check**

```bash
npm run build
```

Očekávaný výstup: úspěšný build.

- [ ] **Krok 3: Commit**

```bash
git add app/ShelfClient.tsx
git commit -m "feat: redesign ShelfClient — dark theme, BottomNav, category filtering"
```

---

## Task 5: BoxModal — dark theme

**Files:**
- Modify: `app/BoxModal.tsx`

- [ ] **Krok 1: Nahradit CSS třídy za dark styly**

Najít a nahradit className řetězce v `app/BoxModal.tsx`. Změny jsou pouze vizuální — logika zůstává beze změny.

Nahradit opening wrapper (řádek 88–89):
```tsx
// STARÝ KÓD:
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
  <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[92vh] overflow-y-auto">
    <div className="p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Upravit bednu</h2>

// NOVÝ KÓD:
<div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
  <div className="rounded-xl w-full max-w-md max-h-[92vh] overflow-y-auto" style={{ background: 'var(--bg-elevated)', border: '1px solid #444', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}>
    <div className="p-6">
      <h2 className="text-lg font-bold mb-4" style={{ color: '#ff6b35', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, textTransform: 'uppercase', fontSize: 18 }}>Upravit bednu</h2>
```

Nahradit label styly (všechny `className="block text-sm font-semibold text-gray-700 mb-1"`):
```tsx
// STARÝ: className="block text-sm font-semibold text-gray-700 mb-1"
// NOVÝ:  className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}
```

Nahradit input styly (všechny `className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"`):
```tsx
// NOVÝ:
className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
style={{ background: '#1a1a1a', border: '1px solid #444', color: 'var(--text-primary)' }}
```

Nahradit select element:
```tsx
// NOVÝ:
className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
style={{ background: '#1a1a1a', border: '1px solid #444', color: 'var(--text-primary)' }}
```

Nahradit seznam položek (container `className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto p-2 mb-2 space-y-1 bg-gray-50"`):
```tsx
// NOVÝ:
className="rounded-lg max-h-48 overflow-y-auto p-2 mb-2 space-y-1"
style={{ background: '#1a1a1a', border: '1px solid #333' }}
```

Nahradit text prázdného stavu `className="text-xs text-gray-400 py-1"`:
```tsx
className="text-xs py-1" style={{ color: 'var(--text-muted)' }}
```

Nahradit hover styl položky (řádek `className={\`flex items-center gap-2 rounded px-1 py-0.5 hover:bg-gray-100 ...`\}):
```tsx
className={`flex items-center gap-2 rounded px-2 py-1.5 transition-colors ${item.checked ? 'opacity-40' : ''}`}
style={{ background: 'transparent' }}
// přidat onMouseEnter/Leave pro hover efekt není nutný — opacity na checked stačí
```

Nahradit text položky `className={...line-through text-gray-400...text-gray-800}`:
```tsx
className={`flex-1 text-sm cursor-pointer select-none ${item.checked ? 'line-through' : ''}`}
style={{ color: item.checked ? 'var(--text-muted)' : 'var(--text-primary)' }}
```

Nahradit remove button `className="text-gray-300 hover:text-red-500 text-xs px-1 flex-shrink-0"`:
```tsx
className="text-xs px-1 flex-shrink-0 transition-colors"
style={{ color: '#444' }}
onMouseEnter={e => (e.currentTarget.style.color = '#ff6b6b')}
onMouseLeave={e => (e.currentTarget.style.color = '#444')}
```

Nahradit input nové položky:
```tsx
className="flex-1 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
style={{ background: '#1a1a1a', border: '1px solid #444', color: 'var(--text-primary)' }}
```

Nahradit tlačítko + (add item):
```tsx
className="px-4 py-1.5 rounded-lg text-lg font-bold transition"
style={{ background: '#1f4a1f', color: '#4ecdc4', border: '1px solid #2d6a4f' }}
```

Nahradit color picker — aktivní stav `border-amber-600` → `border: '2px solid #ff6b35'`:
```tsx
// Pro každý barevný button:
className={`w-8 h-8 rounded-full transition ${color === c.value ? 'scale-110' : ''}`}
style={{ background: c.value, border: color === c.value ? '2px solid #ff6b35' : '2px solid #333' }}
```

Nahradit "Odstranit fotku" button:
```tsx
className="absolute top-1 right-1 text-white text-xs px-2 py-0.5 rounded"
style={{ background: '#8b2020' }}
```

Nahradit "Přidat/Změnit fotku" button:
```tsx
className="px-4 py-2 rounded-lg text-sm transition"
style={{ background: '#1e1e1e', border: '1px solid #444', color: 'var(--text-secondary)' }}
```

Nahradit QR sekci — button text:
```tsx
className="flex items-center gap-2 text-sm font-semibold transition"
style={{ color: 'var(--text-secondary)' }}
// hover: color: '#ff6b35' přes onMouseEnter
```

Nahradit error message `className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3"`:
```tsx
className="text-sm rounded-lg px-3 py-2 mb-3"
style={{ color: '#ff6b6b', background: '#2a1010', border: '1px solid #8b2020' }}
```

Nahradit footer tlačítka:
```tsx
// Zrušit:
className="px-4 py-2.5 rounded-lg text-sm font-medium transition"
style={{ background: '#1e1e1e', color: 'var(--text-secondary)', border: '1px solid #333' }}

// Uložit:
className="px-5 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-40"
style={{ background: '#ff6b35', color: '#111' }}
```

Nahradit "Stáhnout PNG" button v QR sekci:
```tsx
className="px-4 py-1.5 rounded-lg text-sm transition"
style={{ background: '#1e1e1e', border: '1px solid #444', color: 'var(--text-secondary)' }}
```

- [ ] **Krok 2: Build check**

```bash
npm run build
```

Očekávaný výstup: úspěšný build.

- [ ] **Krok 3: Commit**

```bash
git add app/BoxModal.tsx
git commit -m "feat: apply dark theme to BoxModal"
```

---

## Task 6: ItemEditModal — dark theme

**Files:**
- Modify: `app/ItemEditModal.tsx`

- [ ] **Krok 1: Nahradit celý soubor app/ItemEditModal.tsx**

```tsx
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
```

- [ ] **Krok 2: Build check**

```bash
npm run build
```

Očekávaný výstup: úspěšný build.

- [ ] **Krok 3: Commit**

```bash
git add app/ItemEditModal.tsx
git commit -m "feat: apply dark theme to ItemEditModal"
```

---

## Task 7: SettingsModal — dark theme

**Files:**
- Modify: `app/SettingsModal.tsx`

- [ ] **Krok 1: Nahradit celý soubor app/SettingsModal.tsx**

```tsx
'use client'

import { useState } from 'react'

type Props = {
  cols: number
  rows: number
  onSave: (cols: number, rows: number) => Promise<void>
  onClose: () => void
  onLogout: () => Promise<void>
}

export default function SettingsModal({ cols, rows, onSave, onClose, onLogout }: Props) {
  const [newCols, setNewCols] = useState(cols)
  const [newRows, setNewRows] = useState(rows)
  const [saving, setSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const willShrink = newCols * newRows < cols * rows

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }}
    >
      <div
        className="rounded-xl w-full max-w-sm"
        style={{ background: 'var(--bg-elevated)', border: '1px solid #444', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
      >
        <div className="p-6">
          <h2
            className="font-bold mb-5"
            style={{ color: '#ff6b35', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, letterSpacing: 1, textTransform: 'uppercase' }}
          >
            Nastavení regálu
          </h2>

          <div className="flex items-center gap-3 mb-2">
            <label className="text-sm font-semibold w-20" style={{ color: 'var(--text-secondary)' }}>Sloupce:</label>
            <input
              type="number" min={1} max={10} value={newCols}
              onChange={e => setNewCols(Math.min(10, Math.max(1, +e.target.value)))}
              className="w-20 rounded-lg px-3 py-2 text-sm text-center focus:outline-none"
              style={{ background: '#1a1a1a', border: '1px solid #444', color: 'var(--text-primary)' }}
            />
            <span style={{ color: 'var(--text-muted)' }}>×</span>
            <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Řady:</label>
            <input
              type="number" min={1} max={10} value={newRows}
              onChange={e => setNewRows(Math.min(10, Math.max(1, +e.target.value)))}
              className="w-20 rounded-lg px-3 py-2 text-sm text-center focus:outline-none"
              style={{ background: '#1a1a1a', border: '1px solid #444', color: 'var(--text-primary)' }}
            />
          </div>

          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
            Celkem {newCols * newRows} beden
          </p>

          {willShrink && (
            <p className="text-xs mb-4 rounded-lg px-3 py-2" style={{ color: '#ff6b6b', background: '#2a1010', border: '1px solid #8b2020' }}>
              ⚠️ Zmenšením regálu ztratíte data z beden na konci.
            </p>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm font-medium transition"
              style={{ background: '#1e1e1e', color: 'var(--text-secondary)', border: '1px solid #333' }}
            >
              Zrušit
            </button>
            <button
              onClick={async () => { setSaving(true); try { await onSave(newCols, newRows) } finally { setSaving(false) } }}
              disabled={saving}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-40"
              style={{ background: '#ff6b35', color: '#111' }}
            >
              {saving ? 'Ukládám...' : 'Použít'}
            </button>
          </div>

          <div style={{ borderTop: '1px solid #222', marginTop: 16, paddingTop: 16 }}>
            <button
              onClick={async () => { setLoggingOut(true); await onLogout() }}
              disabled={loggingOut}
              className="w-full py-2.5 rounded-lg text-sm transition disabled:opacity-40"
              style={{ background: 'transparent', border: '1px solid #333', color: 'var(--text-muted)' }}
            >
              {loggingOut ? 'Odhlašuji...' : 'Odhlásit se'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Krok 2: Build check**

```bash
npm run build
```

Očekávaný výstup: úspěšný build.

- [ ] **Krok 3: Commit**

```bash
git add app/SettingsModal.tsx
git commit -m "feat: apply dark theme to SettingsModal"
```

---

## Task 8: Box detail stránka — dark theme

**Files:**
- Modify: `app/box/[position]/page.tsx`

- [ ] **Krok 1: Nahradit celý soubor app/box/[position]/page.tsx**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { GarazBox, BoxItem, CATEGORY_DARK_COLORS } from '@/lib/types'
import { PhotoLightbox } from './PhotoLightbox'

export default async function BoxPage({ params }: { params: Promise<{ position: string }> }) {
  const { position: posStr } = await params
  const position = parseInt(posStr, 10)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/box/${position}`)

  const { data: box } = await supabase
    .from('garaz_boxes')
    .select('*')
    .eq('user_id', user.id)
    .eq('position', position)
    .single()

  if (!box) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '16px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <Link href="/" style={{ color: 'var(--text-secondary)', fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
            ← Regál
          </Link>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid #333', overflow: 'hidden' }}>
            <div style={{ height: 3, background: '#333' }} />
            <div style={{ padding: 24 }}>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                Bedna {position + 1}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Tato bedna je zatím prázdná.</p>
              <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid #222' }}>
                <Link
                  href={`/?openBox=${position}`}
                  style={{ flex: 1, textAlign: 'center', padding: '12px', background: '#ff6b35', color: '#111', borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
                >
                  Upravit
                </Link>
                <Link
                  href="/"
                  style={{ padding: '12px 16px', background: '#1e1e1e', color: 'var(--text-secondary)', borderRadius: 8, fontSize: 14, textDecoration: 'none', border: '1px solid #333' }}
                >
                  ← Regál
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const colors = CATEGORY_DARK_COLORS[(box as GarazBox).category]
  const borderColor = colors ? colors.border : '#333'
  const labelColor = colors ? colors.label : '#666'
  const items: BoxItem[] = (box as GarazBox).items ?? []
  const ownedCount = items.filter(i => !i.checked).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '16px', paddingBottom: 32 }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <Link href="/" style={{ color: 'var(--text-secondary)', fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
          ← Regál
        </Link>

        <div style={{ background: 'var(--bg-surface)', borderRadius: 12, border: `2px solid ${borderColor}`, overflow: 'hidden', boxShadow: `0 0 24px ${borderColor}20` }}>
          <div style={{ height: 3, background: borderColor }} />

          <div style={{ padding: 20 }}>
            {box.category && (
              <span style={{ color: labelColor, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, display: 'inline-block', marginBottom: 8 }}>
                {box.category}
              </span>
            )}
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, letterSpacing: 0.5 }}>
              {box.title || `Bedna ${position + 1}`}
            </h1>

            {box.image_url && (
              <img
                src={box.image_url}
                alt="foto bedny"
                style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 16, border: '1px solid #333' }}
              />
            )}

            {items.length > 0 ? (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Obsah ({ownedCount}/{items.length} mám)
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>
                      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1, color: item.checked ? '#333' : '#4ecdc4' }}>
                        {item.checked ? '☐' : '☑'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 14, color: item.checked ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                          {item.text}
                        </span>
                        {item.image_url && (
                          <PhotoLightbox
                            src={item.image_url}
                            alt="foto položky"
                            thumbClass="mt-2 w-20 h-20 object-cover rounded"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>Bedna je prázdná.</p>
            )}

            <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid #1a1a1a' }}>
              <Link
                href={`/?openBox=${position}`}
                style={{ flex: 1, textAlign: 'center', padding: '14px', background: '#ff6b35', color: '#111', borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}
              >
                Upravit
              </Link>
              <Link
                href="/"
                style={{ padding: '14px 18px', background: '#1e1e1e', color: 'var(--text-secondary)', borderRadius: 8, fontSize: 14, textDecoration: 'none', border: '1px solid #333' }}
              >
                ← Regál
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Krok 2: Build check**

```bash
npm run build
```

Očekávaný výstup: úspěšný build.

- [ ] **Krok 3: Commit**

```bash
git add app/box/[position]/page.tsx
git commit -m "feat: apply dark theme to box detail page"
```

---

## Task 9: Login + Register — dark theme

**Files:**
- Modify: `app/login/page.tsx`
- Modify: `app/register/page.tsx`

- [ ] **Krok 1: Nahradit app/login/page.tsx**

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else {
      const params = new URLSearchParams(window.location.search)
      const redirect = params.get('redirect')
      window.location.href = (redirect && redirect.startsWith('/')) ? redirect : '/'
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--bg-elevated)', borderRadius: 16, border: '1px solid #333', padding: 32, width: '100%', maxWidth: 380, boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 700, color: '#ff6b35', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
          ⬡ Digitální Regál
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Přihlaste se ke svému účtu</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>E-mail</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', background: '#1a1a1a', border: '1px solid #444', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Heslo</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: '100%', background: '#1a1a1a', border: '1px solid #444', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          {error && (
            <p style={{ fontSize: 13, color: '#ff6b6b', background: '#2a1010', border: '1px solid #8b2020', borderRadius: 8, padding: '10px 12px' }}>
              {error}
            </p>
          )}
          <button
            type="submit" disabled={loading}
            style={{ width: '100%', background: '#ff6b35', color: '#111', fontWeight: 700, fontSize: 15, padding: '13px', borderRadius: 8, border: 'none', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
          >
            {loading ? 'Přihlašuji...' : 'Přihlásit se'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 20 }}>
          Nemáte účet?{' '}
          <Link href="/register" style={{ color: '#ff6b35', fontWeight: 600 }}>Registrovat se</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Krok 2: Nahradit app/register/page.tsx**

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    })
    if (error) { setError(error.message); setLoading(false) }
    else setDone(true)
  }

  if (done) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--bg-elevated)', borderRadius: 16, border: '1px solid #333', padding: 32, width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Zkontrolujte e-mail</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Poslali jsme vám potvrzovací odkaz na <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
        </p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--bg-elevated)', borderRadius: 16, border: '1px solid #333', padding: 32, width: '100%', maxWidth: 380, boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 700, color: '#ff6b35', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
          ⬡ Digitální Regál
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Vytvořte nový účet</p>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>E-mail</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', background: '#1a1a1a', border: '1px solid #444', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Heslo</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              style={{ width: '100%', background: '#1a1a1a', border: '1px solid #444', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          {error && (
            <p style={{ fontSize: 13, color: '#ff6b6b', background: '#2a1010', border: '1px solid #8b2020', borderRadius: 8, padding: '10px 12px' }}>
              {error}
            </p>
          )}
          <button
            type="submit" disabled={loading}
            style={{ width: '100%', background: '#ff6b35', color: '#111', fontWeight: 700, fontSize: 15, padding: '13px', borderRadius: 8, border: 'none', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
          >
            {loading ? 'Registruji...' : 'Registrovat se'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 20 }}>
          Máte účet?{' '}
          <Link href="/login" style={{ color: '#ff6b35', fontWeight: 600 }}>Přihlásit se</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Krok 3: Build check**

```bash
npm run build
```

Očekávaný výstup: úspěšný build.

- [ ] **Krok 4: Commit**

```bash
git add app/login/page.tsx app/register/page.tsx
git commit -m "feat: apply dark theme to login and register pages"
```

---

## Task 10: Push + ověření

- [ ] **Push na GitHub**

```bash
git push origin master
```

- [ ] **Vizuální ověření** — otevřít appku a zkontrolovat:
  - Hlavní stránka: tmavé pozadí, barevné kartičky, BottomNav dole
  - Tap na kategorii v BottomNav filtruje bedny
  - BoxModal: tmavý modal, oranžová tlačítka
  - Detail bedny: tmavá stránka, barevný border
  - Login: tmavá stránka s oranžovým názvem
