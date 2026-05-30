# Per-Item Photos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ke každé položce v bedně lze přidat vlastní fotografii — přes kameru nebo galerii.

**Architecture:** `compressImage` se přesune do sdílené utility. Nová komponenta `ItemEditModal` umožní editaci textu a fotky položky; fotka se nahraje do Supabase při potvrzení. `BoxModal` zobrazí 📷 indikátor u položek s fotkou a inline lightbox pro zobrazení.

**Tech Stack:** Next.js App Router, React, Supabase JS client, Tailwind CSS

---

## File Map

| Soubor | Akce |
|--------|------|
| `lib/compressImage.ts` | Nový — sdílená utilita |
| `app/ItemEditModal.tsx` | Nový — editace položky + upload fotky |
| `app/BoxModal.tsx` | Úprava — userId prop, item klik, indikátor, lightbox |
| `app/ShelfClient.tsx` | Úprava — předat userId do BoxModal |

---

### Task 1: Extrahovat compressImage do sdílené utility

**Files:**
- Create: `lib/compressImage.ts`
- Modify: `app/BoxModal.tsx`

- [ ] **Krok 1: Vytvořit `lib/compressImage.ts`**

```ts
export async function compressImage(file: File, maxMB = 1): Promise<File> {
  const maxBytes = maxMB * 1024 * 1024
  if (file.size <= maxBytes) return file
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let { width, height } = img
      const maxDim = 2000
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      let quality = 0.85
      const attempt = () => {
        canvas.toBlob(blob => {
          if (!blob) { resolve(file); return }
          if (blob.size <= maxBytes || quality <= 0.1) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
          } else {
            quality = Math.max(0.1, quality - 0.1)
            attempt()
          }
        }, 'image/jpeg', quality)
      }
      attempt()
    }
    img.src = url
  })
}
```

- [ ] **Krok 2: Nahradit inline funkci v `app/BoxModal.tsx` importem**

Odstraň celou funkci `compressImage` (řádky 43–78) a přidej import na začátek souboru:

```ts
import { compressImage } from '@/lib/compressImage'
```

- [ ] **Krok 3: Ověřit že build projde**

```bash
npm run build
```

Očekávaný výstup: žádné TypeScript/build chyby.

- [ ] **Krok 4: Commit**

```bash
git add lib/compressImage.ts app/BoxModal.tsx
git commit -m "refactor: extract compressImage to shared utility"
```

---

### Task 2: Vytvořit ItemEditModal komponentu

**Files:**
- Create: `app/ItemEditModal.tsx`

- [ ] **Krok 1: Vytvořit `app/ItemEditModal.tsx`**

```tsx
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
```

- [ ] **Krok 2: Ověřit TypeScript**

```bash
npx tsc --noEmit
```

Očekávaný výstup: žádné chyby.

- [ ] **Krok 3: Commit**

```bash
git add app/ItemEditModal.tsx
git commit -m "feat: add ItemEditModal component for per-item photo upload"
```

---

### Task 3: Upravit BoxModal — userId, item klik, indikátor, lightbox

**Files:**
- Modify: `app/BoxModal.tsx`

- [ ] **Krok 1: Přidat import a typ userId prop**

Nahraď horní část souboru (imports + Props type):

```tsx
'use client'

import { useState, useRef } from 'react'
import { GarazBox, BoxItem, CATEGORIES, BOX_COLORS } from '@/lib/types'
import { compressImage } from '@/lib/compressImage'
import ItemEditModal from './ItemEditModal'

type Props = {
  box: GarazBox
  userId: string
  onSave: (box: GarazBox, imageFile: File | null) => Promise<void>
  onClose: () => void
}
```

- [ ] **Krok 2: Přidat userId do destructuringu a state pro item edit + lightbox**

Nahraď řádek s `export default function BoxModal(...)` a přidej nové state proměnné:

```tsx
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
  const fileRef = useRef<HTMLInputElement>(null)
```

- [ ] **Krok 3: Přidat handleItemConfirm funkci**

Za `removeItem` funkcí přidej:

```tsx
function handleItemConfirm(idx: number, updated: BoxItem) {
  setItems(prev => prev.map((it, i) => i === idx ? updated : it))
  setEditingItemIdx(null)
}
```

- [ ] **Krok 4: Nahradit řádky renderování položek**

Nahraď celý blok mapování položek (v sekci "Obsah bedny") za:

```tsx
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
```

- [ ] **Krok 5: Přidat ItemEditModal a Lightbox do JSX návratu**

Těsně před uzavírací `</div>` celého modalu (poslední `</div>` v returnu) přidej:

```tsx
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
```

- [ ] **Krok 6: Ověřit TypeScript**

```bash
npx tsc --noEmit
```

Očekávaný výstup: žádné chyby.

- [ ] **Krok 7: Commit**

```bash
git add app/BoxModal.tsx
git commit -m "feat: add per-item photo indicator, edit modal trigger, and lightbox in BoxModal"
```

---

### Task 4: Předat userId z ShelfClient do BoxModal

**Files:**
- Modify: `app/ShelfClient.tsx`

- [ ] **Krok 1: Přidat userId prop do BoxModal v ShelfClient**

V `app/ShelfClient.tsx` najdi JSX element `<BoxModal` a přidej `userId={userId}`:

```tsx
{editingBox && (
  <BoxModal
    box={editingBox}
    userId={userId}
    onSave={handleSave}
    onClose={() => setEditingBox(null)}
  />
)}
```

- [ ] **Krok 2: Ověřit TypeScript a build**

```bash
npx tsc --noEmit && npm run build
```

Očekávaný výstup: žádné chyby, úspěšný build.

- [ ] **Krok 3: Commit**

```bash
git add app/ShelfClient.tsx
git commit -m "feat: pass userId to BoxModal for per-item photo uploads"
```

---

### Task 5: Manuální ověření v prohlížeči

- [ ] **Krok 1: Spustit dev server**

```bash
npm run dev
```

- [ ] **Krok 2: Otestovat přidání fotky k položce**
  1. Otevřít bednu → kliknout na text libovolné položky
  2. V ItemEditModal vybrat fotku z galerie → zobrazí se náhled
  3. Kliknout Potvrdit → dialog se zavře, u položky se zobrazí 📷
  4. Kliknout na 📷 → otevře se lightbox s fotkou
  5. Kliknout mimo fotku → lightbox se zavře

- [ ] **Krok 3: Otestovat Uložit bednu**
  1. Po přidání fotky k položce kliknout Uložit
  2. Zavřít a znovu otevřít bednu → fotka u položky stále zobrazena (📷)

- [ ] **Krok 4: Otestovat odstranění fotky**
  1. Kliknout na položku s fotkou → ItemEditModal
  2. Kliknout Odstranit → náhled zmizí
  3. Potvrdit → 📷 ikonka u položky zmizí

- [ ] **Krok 5: Otestovat kameru na mobilu**
  1. Otevřít na mobilním zařízení
  2. Kliknout na položku → ItemEditModal → 📷 Přidat fotku
  3. Systém nabídne volbu kamera/galerie (díky `capture="environment"`)
