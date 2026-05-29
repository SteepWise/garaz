'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Digitální Regál</h1>
        <p className="text-gray-500 text-sm mb-6">Přihlaste se ke svému účtu</p>

        <form onSubmit={handleLogin} className="space-y-4">
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
              required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Přihlašuji...' : 'Přihlásit se'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Nemáte účet?{' '}
          <Link href="/register" className="text-amber-700 font-semibold hover:underline">Registrovat se</Link>
        </p>
      </div>
    </div>
  )
}
