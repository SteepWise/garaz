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
