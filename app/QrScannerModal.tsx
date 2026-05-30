'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const GARAZ_HOSTS = ['garaz.mocmore.eu', 'localhost']

function parseGarazUrl(raw: string): string | null {
  try {
    const url = new URL(raw)
    if (!GARAZ_HOSTS.some(h => url.hostname === h)) return null
    return url.pathname
  } catch {
    return null
  }
}

export default function QrScannerModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const scannedRef = useRef(false)
  const onCloseRef = useRef(onClose)
  const routerRef = useRef(router)

  useEffect(() => {
    onCloseRef.current = onClose
    routerRef.current = router
  })

  const [permissionDenied, setPermissionDenied] = useState(false)
  const [showError, setShowError] = useState(false)
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cleanup = useCallback(() => {
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    if (errorTimerRef.current) { clearTimeout(errorTimerRef.current); errorTimerRef.current = null }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
  }, [])

  const handleResult = useCallback((raw: string) => {
    if (scannedRef.current) return
    const pathname = parseGarazUrl(raw)
    if (pathname) {
      scannedRef.current = true
      cleanup()
      onCloseRef.current()
      routerRef.current.push(pathname)
    } else {
      setShowError(true)
      errorTimerRef.current = setTimeout(() => setShowError(false), 2500)
    }
  }, [cleanup])

  useEffect(() => {
    let cancelled = false

    async function start() {
      if (!videoRef.current || !canvasRef.current) return
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        video.srcObject = stream
        await video.play()
        const jsQR = (await import('jsqr')).default
        if (cancelled) return

        function tick() {
          if (cancelled || scannedRef.current || !ctx) return
          if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            ctx.drawImage(video, 0, 0)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' })
            if (code) { handleResult(code.data); return }
          }
          rafRef.current = requestAnimationFrame(tick)
        }

        rafRef.current = requestAnimationFrame(tick)
      } catch (err) {
        if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
          setPermissionDenied(true)
        }
      }
    }

    start()
    return () => { cancelled = true; cleanup() }
  }, [cleanup, handleResult])

  const handleClose = () => { cleanup(); onClose() }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" onClick={handleClose}>
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white text-xl leading-none"
      >✕</button>

      {permissionDenied ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center text-white">
          <p className="text-sm opacity-70">Přístup ke kameře byl zamítnut.</p>
          <button onClick={handleClose} className="px-5 py-2 rounded-xl border border-white/20 text-sm text-white/80">Zavřít</button>
        </div>
      ) : (
        <>
          <canvas ref={canvasRef} className="hidden" />
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
          />
          <div className="flex-1 flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <div className="w-60 h-60 border-2 border-amber-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
          </div>
          {showError && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-white text-sm px-4 py-2 rounded-xl">
              Neznámý QR kód
            </div>
          )}
          <p className="absolute bottom-8 w-full text-center text-white/50 text-xs">Namiřte kameru na QR kód bedny</p>
        </>
      )}
    </div>
  )
}
