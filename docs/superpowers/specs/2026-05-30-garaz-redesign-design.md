# Garáž App — Vizuální Redesign

**Datum:** 2026-05-30  
**Scope:** Kompletní vizuální přepracování všech stránek a komponent  
**Primární zařízení:** Tablet (10"), sekundárně mobil

---

## Kontext

Rodinná webová appka pro správu obsahu garáže — digitální regál s bednami. Každá bedna má název, kategorii, seznam položek a volitelnou fotku. Primárně se používá na tabletu při hledání věcí v garáži.

Stávající vzhled: světle šedé pozadí, bílé komponenty, amber akcenty, hnědý regál. Funkční, ale nevýrazné a špatně optimalizované pro tablet (malé touch targety, drobný text).

---

## Design Direction

### Paleta

| Token | Hodnota | Použití |
|-------|---------|---------|
| `--bg-base` | `#111111` | Hlavní pozadí stránek |
| `--bg-surface` | `#1e1e1e` | Kartičky, panely |
| `--bg-elevated` | `#2a2a2a` | Modaly, inputs |
| `--border-subtle` | `#333333` | Jemné dělení |
| `--accent` | `#ff6b35` | Primární akcent (oranžová) |
| `--accent-dim` | `#7a3215` | Hover stav akcentu |
| `--text-primary` | `#eeeeee` | Hlavní text |
| `--text-secondary` | `#888888` | Popisky, metadata |
| `--text-muted` | `#444444` | Disabled, placeholder |

### Barvy kategorií (zachovat existující, ztmavit)

Každá kategorie dostane dvě hodnoty: `--cat-border` (border kartičky) a `--cat-label` (barva štítku). Příklady:
- Nářadí: border `#b8860b`, label `#ffd700`
- Elektro: border `#1a6b8a`, label `#4ecdc4`
- Zahrada: border `#2d6a4f`, label `#74c69d`
- Auto: border `#8b2020`, label `#ff6b6b`
- Domácnost: border `#5a4a78`, label `#c084fc`
- Malování: border `#7a3060`, label `#f9a8d4`
- Spojovací: border `#7a6020`, label `#fbbf24`
- Různé: border `#444`, label `#aaa`

### Typografie

- **Display/nadpisy:** `Barlow Condensed` (Bold 700) — import z Google Fonts
- **Tělo:** systémový sans-serif stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`)
- **Čísla / kódy:** `'Courier New', monospace` — pro počítadla a QR reference

Minimální velikost textu v UI: **13px**. Na kartičkách beden: **14px název, 12px položky**.

---

## Komponenty

### 1. Layout wrapper (globální)

Každá stránka dostane tmavé pozadí `--bg-base`. Přidat do `app/globals.css` CSS proměnné a základní dark theme styly.

### 2. Spodní navigační lišta (`BottomNav` — nová komponenta)

**Umístění:** `app/BottomNav.tsx`

**Struktura:**
```
[ 📦 Regál ] [ 🔧 ] [ ⚡ ] [ 🌱 ] [ 🚗 ] [ ··· ] [ 📷 Sken ] [ ⚙ ]
```

- Levá skupina: "Vše" + kategorie jako ikony (tap = filtrování)
- Pravá skupina: Skenovat, Nastavení
- Aktivní stav: oranžový accent + podtržení
- Výška: min 56px, touch target každé položky min 48×48px
- Background: `#0d0d0d`, border-top: `1px solid #ff6b35`
- Scroll stránky nezakrývá obsah — přidat `padding-bottom: 72px` na hlavní container

**Props:**
```ts
type BottomNavProps = {
  activeCategory: string        // '' = vše
  onCategoryChange: (cat: string) => void
  onScanClick: () => void
  onSettingsClick: () => void
}
```

Kategorie s více než 4 položkami: zobrazit prvních 4 + "···" tlačítko. Tap na "···" zobrazí jednoduchý dropdown/popover se zbývajícími kategoriemi přímo nad lištou (absolute positioned, `z-index: 100`). Klik mimo zavře.

### 3. Kartičky beden (úprava `ShelfClient`)

**Velikost:** min-height `120px`, padding `12px`  
**Border:** `2px solid <cat-border-color>`, border-radius `8px`  
**Background:** `--bg-surface` (`#1e1e1e`)

**Struktura kartičky:**
```
┌─────────────────────────────┐
│ [KATEGORIE ŠTÍTEK]          │
│ Název bedny (bold, 14px)    │
│ ─────────────────           │
│ ☑ Položka 1    (12px)      │
│ ☑ Položka 2                │
│ ☐ Položka 3  (šedě)        │
│ +N dalších...               │
│                      3/5 →  │
└─────────────────────────────┘
```

- Štítek kategorie: malý pill v barvě kategorie vlevo nahoře
- Počítadlo `X/Y mám` vpravo dole, barva akcentu pokud X < Y, zelená pokud X == Y
- Hover/active stav: `scale(1.01)` + lehký glow `box-shadow: 0 0 12px <cat-color>40`
- Prázdná bedna: přerušovaný border, šedý `+` uprostřed

### 4. `ShelfClient` — filtrování

Přidat state `activeCategory: string`. Když není `''`, filtrovat `boxes` před renderem. `BottomNav` dostane callback pro změnu.

Filtrování je **čistě frontendové** — žádné nové requesty na Supabase.

### 5. `BoxModal` — tmavý redesign

- Background: `--bg-elevated` (`#2a2a2a`), border `1px solid #444`
- Inputs: background `#1e1e1e`, border `#444`, text `#eee`, focus ring `#ff6b35`
- Label texty: `#888`
- Tlačítko Uložit: `background: #ff6b35`, hover `#e5531a`
- Tlačítko Zrušit: `background: #333`, hover `#3a3a3a`
- Položky v seznamu: hover `#333`, checkboxy s `accent-color: #ff6b35`

### 6. Detail bedny `/box/[position]`

- Celá stránka tmavá (`--bg-base`)
- Card: `--bg-surface`, border v barvě kategorie
- Zpět odkaz: oranžový `← Regál`
- Tlačítko Upravit: výrazné, oranžové, plná šířka dole
- Položky: větší řádky (min 40px), checkboxové ikony větší (16px), chybějící položky výrazně šedé

### 7. Login stránka

- Dark pozadí, card `--bg-elevated`
- Název "⬡ Digitální Regál" s Barlow Condensed, oranžová
- Vstupy v dark stylu shodném s BoxModal

---

## Soubory ke změně

| Soubor | Typ změny |
|--------|-----------|
| `app/globals.css` | Přidat CSS proměnné, dark base styly |
| `app/layout.tsx` | Přidat `<body>` dark třídu, Google Fonts import |
| `app/ShelfClient.tsx` | Nová navigace, filtry, přepracované kartičky |
| `app/BoxModal.tsx` | Dark theme pro celý modal |
| `app/box/[position]/page.tsx` | Dark theme pro detail stránku |
| `app/login/page.tsx` | Dark theme pro login |
| `app/register/page.tsx` | Dark theme pro registraci |
| `app/SettingsModal.tsx` | Dark theme |
| `app/ItemEditModal.tsx` | Dark theme |

## Nové soubory

| Soubor | Popis |
|--------|-------|
| `app/BottomNav.tsx` | Spodní navigační lišta s filtry |

---

## Integrace barev kategorií

Nové barvy kategorií se definují jako JS objekt v `lib/types.ts` jako `CATEGORY_DARK_COLORS` (zachovat stávající `CATEGORY_COLORS` pro zpětnou kompatibilitu):

```ts
export const CATEGORY_DARK_COLORS: Record<string, { border: string; label: string }> = {
  '🔧 Nářadí':           { border: '#b8860b', label: '#ffd700' },
  '⚡ Elektro':          { border: '#1a6b8a', label: '#4ecdc4' },
  // ... atd.
}
```

Komponenty ho budou importovat a aplikovat inline styly (border-color, color) — stejný vzor jako současný `CATEGORY_COLORS`.

---

## Co se NEMĚNÍ

- Databázová logika, Supabase queries, typy
- Funkčnost (přidávání položek, fotky, QR kódy, skenování)
- URL struktura

---

## Akcesibilita a výkon

- Všechny touch targety min. **48×48px**
- Kontrast textu na tmavém pozadí: min. 4.5:1 (WCAG AA)
- Google Fonts: `display=swap`, pouze potřebné váhy (700 pro Barlow Condensed)
- Žádné nové závislosti — čistý CSS + Tailwind
