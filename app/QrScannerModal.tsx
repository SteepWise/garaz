'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function QrScannerModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('qr-reader-hidden')
      const decodedText = await scanner.scanFile(file, false)
      const origin = window.location.origin
      const escaped = origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const match = decodedText.match(new RegExp(`^${escaped}/box/(\\d+)$`))
      if (match) {
        router.push(`/box/${match[1]}`)
        onClose()
      } else {
        alert('Neznámý QR kód')
        onClose()
      }
    } catch {
      alert('QR kód se nepodařilo přečíst.')
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-800">Naskenovat QR kód</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >✕</button>
        </div>
        <div id="qr-reader-hidden" className="hidden" />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full py-10 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-semibold text-base transition"
        >
          Vyfotit QR kód
        </button>
        <p className="text-xs text-gray-400 text-center mt-3">Namiřte kameru na QR kód bedny a vyfoťte ho</p>
      </div>
    </div>
  )
}
