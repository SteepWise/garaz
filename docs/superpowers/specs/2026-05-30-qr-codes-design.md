# QR kódy beden — Design Spec

**Datum:** 2026-05-30  
**Stav:** Schváleno

---

## Přehled

Každá bedna dostane unikátní QR kód odkazující na `/box/{position}`. Uživatel může QR kód zobrazit a stáhnout z BoxModalu, nebo naskenovat cizí QR přímo v aplikaci přes vestavěný skener.

---

## Funkce

### 1. QR kód v BoxModalu

- Nová skládací sekce "QR kód" v dolní části BoxModalu
- Zobrazí QR kód s URL `https://[doména]/box/{position}`
- Tlačítko "Stáhnout PNG" — stáhne QR jako obrázek pro tisk štítku
- Library: `qrcode.react` (komponenta `<QRCodeCanvas>`)
- Doména se čte z `window.location.origin` (funguje na localhostu i produkci)

### 2. Stránka `/box/[position]`

- Server Component (`app/box/[position]/page.tsx`)
- Načte data bedny ze Supabase server-side (`createServerClient`)
- Není přihlášen → `redirect('/login?redirect=/box/' + position)`
- Bedna neexistuje → zobrazí "Bedna nenalezena"
- Zobrazí:
  - Název bedny + barevný pruh kategorie
  - Seznam položek se stavy (☑ splněno / ☐ nesplněno)
  - Fotky položek (pokud existují)
  - Foto bedny (pokud existuje)
- Tlačítko **"Upravit"** → link na `/?openBox={position}`
- Tlačítko **"← Zpět na regál"** → link na `/`

### 3. Login redirect

- `app/login/page.tsx` přečte `searchParams.redirect`
- Po úspěšném přihlášení: `router.push(redirect ?? '/')`
- Validace: redirect musí začínat `/` (ochrana před open redirect)

### 4. Auto-otevření modalu (`?openBox=`)

- `app/page.tsx` předá `searchParams.openBox` do `ShelfClient` jako prop `openBox?: number`
- `ShelfClient` v `useEffect` při mount: pokud `openBox` existuje, najde bednu na té pozici a setne `editingBox`
- Po zavření modalu URL zůstane (není nutné čistit param)

### 5. Skener QR kódů

- Tlačítko 📷 v hlavičce regálu (vedle tlačítka "Nastavení")
- Otevře `QrScannerModal` — modal s živým náhledem kamery
- Library: `html5-qrcode`
- Po detekci QR kódu:
  - Pokud URL odpovídá `[origin]/box/{číslo}` → `router.push('/box/{číslo}')`
  - Jinak → zobrazí toast "Neznámý QR kód"
- Tlačítko "Zavřít" / klik mimo modal skener zastaví

---

## Architektura

```
app/
  box/
    [position]/
      page.tsx          # nový — server component, read-only detail
  QrScannerModal.tsx    # nový — kamera + html5-qrcode
  login/
    page.tsx            # upravit — redirect po přihlášení
  page.tsx              # upravit — předat openBox do ShelfClient
  ShelfClient.tsx       # upravit — openBox prop + auto-open + skener tlačítko
  BoxModal.tsx          # upravit — QR sekce s qrcode.react
```

---

## Závislosti

| Package | Verze | Účel |
|---|---|---|
| `qrcode.react` | latest | Generování QR kódu |
| `html5-qrcode` | latest | Skenování QR kódu kamerou |

---

## Bezpečnost

- Login redirect validuje že cíl začíná `/` — zabraňuje přesměrování na externí doménu
- Stránka `/box/[position]` vyžaduje přihlášení, zobrazuje pouze data přihlášeného uživatele

---

## Co není součástí

- Sdílení bedny s jiným uživatelem (vše je privátní)
- Veřejný náhled bez přihlášení
- Editace přímo na stránce `/box/[position]`
