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
    <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm text-center">
        <div className="text-4xl mb-4">📧</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Zkontrolujte e-mail</h2>
        <p className="text-gray-500 text-sm">Poslali jsme vám potvrzovací odkaz na <strong>{email}</strong>.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Digitální Regál</h1>
        <p className="text-gray-500 text-sm mb-6">Vytvořte nový účet</p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">E-mail</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Heslo</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required minLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Registruji...' : 'Registrovat se'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Máte účet?{' '}
          <Link href="/login" className="text-amber-700 font-semibold hover:underline">Přihlásit se</Link>
        </p>
      </div>
    </div>
  )
}
