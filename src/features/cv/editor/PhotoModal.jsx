import { useEffect, useRef, useState } from 'react'
import { uploadCvPhoto } from '../../../api/cvs'

const MIN_SCALE = 0.5
const MAX_SCALE = 4

export default function PhotoModal({ open, src, cvId, onChange, onClose }) {
  const fileRef = useRef(null)
  const stageRef = useRef(null)
  const drag = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    const el = stageRef.current
    if (!open || !el || !src) return
    const onWheel = (e) => {
      e.preventDefault()
      setScale((s) =>
        Math.min(MAX_SCALE, Math.max(MIN_SCALE, s + (e.deltaY < 0 ? 0.1 : -0.1))),
      )
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [open, src])

  const onPointerDown = (e) => {
    if (scale <= 1) return
    drag.current = {
      startX: e.clientX - pan.x,
      startY: e.clientY - pan.y,
      pointerId: e.pointerId,
    }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e) => {
    if (!drag.current) return
    setPan({ x: e.clientX - drag.current.startX, y: e.clientY - drag.current.startY })
  }

  const onPointerUp = (e) => {
    if (!drag.current) return
    e.currentTarget.releasePointerCapture?.(drag.current.pointerId)
    drag.current = null
  }

  const zoom = (step) =>
    setScale((s) =>
      Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round((s + step) * 100) / 100)),
    )

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !cvId) return
    setBusy(true)
    setError('')
    try {
      const { data } = await uploadCvPhoto(cvId, file)
      onChange(data.photo)
      setScale(1)
      setPan({ x: 0, y: 0 })
    } catch (err) {
      setError(err?.response?.data?.detail || "Impossible d'importer la photo.")
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = () => {
    onChange('')
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Photo du CV</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-5 w-5"
              aria-hidden
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="relative" ref={stageRef}>
          {src ? (
            <div
              className="flex h-[50vh] cursor-grab touch-none select-none items-center justify-center overflow-hidden bg-slate-100 active:cursor-grabbing"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            >
              <img
                src={src}
                alt="Photo du CV"
                draggable={false}
                style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-[40vh] flex-col items-center justify-center gap-3 p-4 text-slate-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-12 w-12"
                aria-hidden
              >
                <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                <path d="M4 20c0-3.3 3.6-5 8-5s8 1.7 8 5" />
              </svg>
              <p className="text-sm">Aucune photo. Importez-en une :</p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
              >
                Importer une photo
              </button>
            </div>
          )}
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 text-sm font-medium text-white">
              Import…
            </div>
          )}
        </div>

        {src && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => zoom(-0.25)}
                disabled={scale <= MIN_SCALE}
                aria-label="Zoom arrière"
                className="rounded-lg border border-slate-300 px-2.5 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                −
              </button>
              <button
                type="button"
                onClick={() => setScale(1)}
                disabled={scale === 1}
                title="Réinitialiser le zoom"
                className="w-14 rounded-lg border border-slate-300 px-2 py-1 text-center text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                {Math.round(scale * 100)} %
              </button>
              <button
                type="button"
                onClick={() => zoom(0.25)}
                disabled={scale >= MAX_SCALE}
                aria-label="Zoom avant"
                className="rounded-lg border border-slate-300 px-2.5 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                ＋
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none disabled:opacity-50"
              >
                Importer une autre photo
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none"
              >
                Supprimer
              </button>
            </div>
          </div>
        )}

        {error && <p className="border-t border-slate-200 px-4 py-2 text-xs text-red-600">{error}</p>}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}