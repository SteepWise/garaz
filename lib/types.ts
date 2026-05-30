export type BoxItem = {
  text: string
  checked: boolean
  image_url?: string
}

export type GarazBox = {
  id: string | null
  user_id: string
  position: number
  title: string
  category: string
  items: BoxItem[]
  color: string
  image_url: string | null
  created_at: string
  updated_at: string
}

export type GarazSettings = {
  user_id: string
  cols: number
  rows: number
}

export const CATEGORIES = [
  { value: '', label: '— bez kategorie —', color: '' },
  { value: '🔧 Nářadí', label: '🔧 Nářadí', color: '#fff3cd' },
  { value: '⚡ Elektro', label: '⚡ Elektro', color: '#cce5ff' },
  { value: '🌱 Zahrada', label: '🌱 Zahrada', color: '#d4edda' },
  { value: '🚗 Auto', label: '🚗 Auto', color: '#f8d7da' },
  { value: '🏠 Domácnost', label: '🏠 Domácnost', color: '#e2d9f3' },
  { value: '🎨 Malování', label: '🎨 Malování', color: '#fde2e4' },
  { value: '🔩 Spojovací materiál', label: '🔩 Spojovací materiál', color: '#ffeeba' },
  { value: '📦 Různé', label: '📦 Různé', color: '#e2e3e5' },
]

export const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  CATEGORIES.filter(c => c.value).map(c => [c.value, c.color])
)

export const BOX_COLORS = [
  { value: '#ffffff', label: 'Bílá' },
  { value: '#ffcccc', label: 'Červená' },
  { value: '#ccffcc', label: 'Zelená' },
  { value: '#ccccff', label: 'Modrá' },
  { value: '#ffffcc', label: 'Žlutá' },
  { value: '#ffccff', label: 'Růžová' },
  { value: '#e6e6e6', label: 'Šedá' },
]

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
