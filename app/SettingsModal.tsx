'use client'

import { useState } from 'react'

type Props = {
  cols: number
  rows: number
  onSave: (cols: number, rows: number) => void
  onClose: () => void
}

export default function SettingsModal({ cols, rows, onSave, onClose }: Props) {
  const [newCols, setNewCols] = useState(cols)
  const [newRows, setNewRows] = useState(rows)

  const willShrink = newCols * newRows < cols * rows

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Nastavení regálu</h2>

          <div className="flex items-center gap-3 mb-2">
            <label className="text-sm font-semibold text-gray-700 w-20">Sloupce:</label>
            <input
              type="number" min={1} max={10} value={newCols}
              onChange={e => setNewCols(Math.min(10, Math.max(1, +e.target.value)))}
              className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <span className="text-gray-400">×</span>
            <label className="text-sm font-semibold text-gray-700">Řady:</label>
            <input
              type="number" min={1} max={10} value={newRows}
              onChange={e => setNewRows(Math.min(10, Math.max(1, +e.target.value)))}
              className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <p className="text-xs text-gray-400 mb-2">Celkem {newCols * newRows} beden</p>

          {willShrink && (
            <p className="text-xs text-red-600 mb-4 bg-red-50 rounded-lg px-3 py-2">
              ⚠️ Zmenšením regálu ztratíte data z beden na konci.
            </p>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <button onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition">
              Zrušit
            </button>
            <button onClick={() => onSave(newCols, newRows)}
              className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-semibold transition">
              Použít
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
