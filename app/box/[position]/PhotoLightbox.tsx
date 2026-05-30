'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  src: string
  alt: string
  thumbClass?: string
}

export function PhotoLightbox({ src, alt, thumbClass }: Props) {
  const [open, setOpen] = useState(false)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const lastDist = useRef<number | null>(null)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const isDragging = useRef(false)

  useEffect(() => {
    if (!open) {
      setScale(1)
      setOffset({ x: 0, y: 0 })
    }
  }, [open])

  function onWheel(e: React.WheelEvent) {
    e.preventDefault()
    setScale(s => Math.min(8, Math.max(1, s - e.deltaY * 0.002)))
  }

  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (lastDist.current !== null) {
        const delta = dist - lastDist.current
        setScale(s => Math.min(8, Math.max(1, s + delta * 0.01)))
      }
      lastDist.current = dist
      lastPos.current = null
    } else if (e.touches.length === 1 && scale > 1) {
      const pos = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      if (lastPos.current) {
        const dx = pos.x - lastPos.current.x
        const dy = pos.y - lastPos.current.y
        setOffset(o => ({ x: o.x + dx, y: o.y + dy }))
      }
      lastPos.current = pos
    }
  }

  function onTouchEnd() {
    lastDist.current = null
    lastPos.current = null
    if (scale <= 1) setOffset({ x: 0, y: 0 })
  }

  function onMouseDown(e: React.MouseEvent) {
    if (scale <= 1) return
    isDragging.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging.current || !lastPos.current) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    setOffset(o => ({ x: o.x + dx, y: o.y + dy }))
    lastPos.current = { x: e.clientX, y: e.clientY }
  }

  function onMouseUp() {
    isDragging.current = false
    lastPos.current = null
  }

  function onOverlayClick() {
    if (!isDragging.current) setOpen(false)
  }

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={`${thumbClass} cursor-zoom-in`}
        onClick={() => setOpen(true)}
      />

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={onOverlayClick}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl leading-none w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 z-10"
            onClick={() => setOpen(false)}
          >
            ×
          </button>

          <img
            src={src}
            alt={alt}
            onClick={e => e.stopPropagation()}
            onWheel={onWheel}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            style={{
              transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
              transition: isDragging.current ? 'none' : 'transform 0.1s ease',
              cursor: scale > 1 ? 'grab' : 'zoom-in',
              maxWidth: '95vw',
              maxHeight: '95vh',
              objectFit: 'contain',
              userSelect: 'none',
            }}
          />

          {scale > 1 && (
            <button
              className="absolute bottom-4 right-4 text-white text-xs bg-black/40 px-3 py-1 rounded-full"
              onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }) }}
            >
              Resetovat zoom
            </button>
          )}
        </div>
      )}
    </>
  )
}
