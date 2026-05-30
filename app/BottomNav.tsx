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
      background: 'var(--bg-nav)', borderTop: '2px solid #ff6b35',
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
