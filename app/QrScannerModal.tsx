'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function QrScannerModal({ onClose }: { onClose: () => void }) {
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null)
  const router = useRouter()

  useEffect(() => {
    let stopped = false

    async function startScanner() {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText: string) => {
            if (stopped) return
            stopped = true
            scanner.stop().catch(() => {})
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
          },
          undefined
        )
      } catch {
        alert('Nelze získat přístup ke kameře.')
        onClose()
      }
    }

    startScanner()

    return () => {
      stopped = true
      scannerRef.current?.stop().catch(() => {})
    }
  }, [])

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
        <div id="qr-reader" className="w-full rounded-lg overflow-hidden" />
        <p className="text-xs text-gray-400 text-center mt-3">Namiřte kameru na QR kód bedny</p>
      </div>
    </div>
  )
}
