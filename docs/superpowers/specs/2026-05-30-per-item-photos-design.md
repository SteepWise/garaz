# Per-Item Photos — Design Spec
Date: 2026-05-30

## Overview

Každá položka v bedně může mít vlastní fotografii. Fotka je uložena v Supabase storage a URL je perzistována v JSONB poli `items` tabulky `garaz_boxes`.

## Data Model

`BoxItem` (již existuje v `lib/types.ts`):
```ts
type BoxItem = {
  text: string
  checked: boolean
  image_url?: string  // URL fotky v garaz_photos bucketu
}
```

Upload path: `${userId}/items/${boxPosition}-${itemIndex}-${Date.now()}.jpg`

## Komponenty

### Nová: `app/ItemEditModal.tsx`
- Props: `item: BoxItem`, `onConfirm: (item: BoxItem) => void`, `onClose: () => void`, `userId: string`, `boxPosition: number`, `itemIndex: number`
- Zobrazuje: textový input pro text, foto upload s `accept="image/*"` a `capture="environment"`, náhled fotky, tlačítka Potvrdit/Zrušit
- Při Potvrdit: nahraje fotku do Supabase (pokud byla vybrána nová), pak zavolá `onConfirm` s aktualizovaným item
- Upload selhání: zobrazí chybovou hlášku, dialog zůstane otevřený

### Sdílená: `lib/compressImage.ts`
- Přesune `compressImage` funkci z `BoxModal.tsx` do sdíleného souboru
- Importována v `BoxModal` i `ItemEditModal`

### Úpravy `app/BoxModal.tsx`
- Přidá prop `userId: string`
- Inicializuje Supabase klienta interně (`createClient()`)
- Každá řádka položky: klik na text/checkbox oblast → otevře `ItemEditModal`
- Zobrazí 📷 ikonku u položek kde `item.image_url` existuje
- Klik na 📷 ikonku → otevře lightbox (zastaví propagaci eventu)
- Inline `Lightbox`: fullscreen overlay, obrázek se scroll/zoom přes CSS

### Úpravy `app/ShelfClient.tsx`
- Předá `userId` prop do `BoxModal`

## Data Flow

1. Klik na položku v BoxModal → `ItemEditModal` otevřen
2. Výběr fotky → lokální náhled (blob URL)
3. Potvrdit → upload do `garaz_photos` → `onConfirm({ ...item, image_url })`
4. BoxModal aktualizuje `items` state
5. Uložit bednu → `items` array s `image_url` uložen jako JSONB

## Error Handling

- Upload selže → chybová hláška v ItemEditModal, dialog zůstane otevřený
- Odstranění fotky → `image_url: undefined` (soubor v bucketu zůstane, stejný přístup jako u boxové fotky)

## Lightbox

- CSS-only zoom: `overflow: auto` kontejner + `transform: scale()` na obrázku přes touch/scroll events
- Pinch-to-zoom přes nativní browser gesta (`touch-action: pinch-zoom`)
- Klik mimo obrázek → zavřít
- Žádná externí knihovna

## Soubory ke změně

| Soubor | Akce |
|--------|------|
| `lib/compressImage.ts` | Nový — přesun funkce |
| `app/ItemEditModal.tsx` | Nový |
| `app/BoxModal.tsx` | Úprava — userId prop, item klik, 📷 indikátor, lightbox |
| `app/ShelfClient.tsx` | Úprava — předat userId do BoxModal |
| `lib/types.ts` | Beze změny (image_url už existuje) |
