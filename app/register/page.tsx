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
