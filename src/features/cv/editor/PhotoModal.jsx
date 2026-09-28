import { useCallback, useEffect, useRef, useState } from 'react'
import { uploadCvPhoto } from '../../../api/cvs'

const MIN_SCALE = 1
const MAX_SCALE = 5

const fmt = (n) =>
  Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100)

const round2 = (n) => Math.round(n * 100) / 100

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))

const MAXD = 300

const toFrameDelta = (rotation, dSx, dSy) => {
  const rad = (rotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return { fx: dSx * cos + dSy * sin, fy: -dSx * sin + dSy * cos }
}

export default function PhotoModal({
  open,
  src,
  cvId,
  photoScale = '1',
  photoRotation = '0',
  photoOffsetX = '50',
  photoOffsetY = '50',
  onChange,
  onClose,
}) {
  const fileRef = useRef(null)
  const frameRef = useRef(null)
  const drag = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [nat, setNat] = useState({ w: 0, h: 0 })
  const [scale, setScale] = useState(() => Number.parseFloat(photoScale) || 1)
  const [rotation, setRotation] = useState(() => Number.parseFloat(photoRotation) || 0)
  const [ox, setOx] = useState(() => Number.parseFloat(photoOffsetX) || 50)
  const [oy, setOy] = useState(() => Number.parseFloat(photoOffsetY) || 50)

  const stored = {
    scale: Number.parseFloat(photoScale) || 1,
    rotation: Number.parseFloat(photoRotation) || 0,
    ox: Number.parseFloat(photoOffsetX) || 50,
    oy: Number.parseFloat(photoOffsetY) || 50,
  }
  const dirty =
    scale !== stored.scale ||
    rotation !== stored.rotation ||
    ox !== stored.ox ||
    oy !== stored.oy

  const ar = nat.w && nat.h ? nat.w / nat.h : 1
  const dispW = ar >= 1 ? MAXD : MAXD * ar
  const dispH = ar >= 1 ? MAXD / ar : MAXD
  const minDim = Math.min(dispW, dispH)
  const side = src ? clamp(minDim / scale, minDim / MAX_SCALE, minDim) : 0
  const cOx = clamp(ox, side / 2 / dispW * 100, 100 - (side / 2 / dispW) * 100)
  const cOy = clamp(oy, side / 2 / dispH * 100, 100 - (side / 2 / dispH) * 100)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const zoom = useCallback(
    (step) => setScale((s) => clamp(round2(s + step), MIN_SCALE, MAX_SCALE)),
    []
  )

  useEffect(() => {
    const el = frameRef.current
    if (!open || !el || !src) return
    const onWheel = (e) => {
      e.preventDefault()
      zoom(e.deltaY < 0 ? 0.1 : -0.1)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [open, src, zoom])

  const rotate = (step) =>
    setRotation((r) => ((((r + step) % 360) + 360) % 360))

  const resetAll = () => {
    setScale(stored.scale)
    setRotation(stored.rotation)
    setOx(stored.ox)
    setOy(stored.oy)
  }

  const confirmTransforms = () => {
    onChange('photo_scale', fmt(scale))
    onChange('photo_rotation', fmt(rotation))
    onChange('photo_offset_x', fmt(ox))
    onChange('photo_offset_y', fmt(oy))
    onClose()
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !cvId) return
    setBusy(true)
    setError('')
    try {
      const { data } = await uploadCvPhoto(cvId, file)
      onChange('photo', data.photo)
      onChange('photo_scale', null)
      onChange('photo_rotation', null)
      onChange('photo_offset_x', null)
      onChange('photo_offset_y', null)
      setScale(1)
      setRotation(0)
      setOx(50)
      setOy(50)
    } catch (err) {
      setError(err?.response?.data?.detail || "Impossible d'importer la photo.")
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = () => {
    onChange('photo', '')
    onChange('photo_scale', null)
    onChange('photo_rotation', null)
    onChange('photo_offset_x', null)
    onChange('photo_offset_y', null)
    onClose()
  }

  const beginMove = (e) => {
    drag.current = {
      mode: 'move',
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startOx: ox,
      startOy: oy,
    }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const beginResize = (e) => {
    e.stopPropagation()
    drag.current = {
      mode: 'resize',
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startSide: side,
    }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e) => {
    if (!drag.current || !src) return
    const { mode, startX, startY, startOx, startOy, startSide } = drag.current
    const { fx, fy } = toFrameDelta(rotation, e.clientX - startX, e.clientY - startY)
    if (mode === 'move') {
      const hw = (side / 2 / dispW) * 100
      const hh = (side / 2 / dispH) * 100
      setOx(clamp(startOx + (fx / dispW) * 100, hw, 100 - hw))
      setOy(clamp(startOy + (fy / dispH) * 100, hh, 100 - hh))
    } else {
      const next = clamp(startSide + (fx + fy) / Math.SQRT2, minDim / MAX_SCALE, minDim)
      setScale(clamp(round2(minDim / next), MIN_SCALE, MAX_SCALE))
    }
  }

  const onPointerUp = (e) => {
    if (!drag.current) return
    e.currentTarget.releasePointerCapture?.(drag.current.pointerId)
    drag.current = null
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl"
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

        <div className="relative">
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
            <div className="flex h-[340px] items-center justify-center overflow-hidden rounded-2xl bg-slate-100 p-2">
              {src ? (
                nat.w ? (
                  <div
                    ref={frameRef}
                    className="relative cursor-move touch-none select-none"
                    style={{
                      width: dispW,
                      height: dispH,
                      transform: `rotate(${rotation}deg)`,
                    }}
                    onPointerDown={beginMove}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerLeave={onPointerUp}
                  >
                    <img
                      src={src}
                      alt="Photo à rogner"
                      style={{ width: dispW, height: dispH }}
                      onLoad={(e) => {
                        const el = e.currentTarget
                        if (el.naturalWidth) setNat({ w: el.naturalWidth, h: el.naturalHeight })
                      }}
                      draggable={false}
                      className="pointer-events-none block"
                    />
                    <div
                      className="absolute border-2 border-indigo-500"
                      style={{ left: `${cOx}%`, top: `${cOy}%`, width: side, height: side, transform: 'translate(-50%, -50%)' }}
                    >
                      <span className="pointer-events-none absolute -left-0.5 -top-0.5 h-2 w-2 bg-indigo-500" />
                      <span className="pointer-events-none absolute -right-0.5 -bottom-0.5 h-2 w-2 bg-white outline outline-1 outline-indigo-500" />
                      <button
                        type="button"
                        aria-label="Redimensionner le cadrage"
                        onPointerDown={beginResize}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerLeave={onPointerUp}
                        className="absolute -right-3 -bottom-3 h-6 w-6 cursor-nwse-resize rounded border border-indigo-500 bg-white p-0.5"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          className="h-4 w-4 text-indigo-500"
                          aria-hidden
                        >
                          <path d="M7 21L21 7M7 21h6M7 21v-6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-slate-500">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-500" />
                    <p className="text-sm">Chargement de la photo…</p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 p-4 text-slate-500">
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
            </div>

            {src && (
              <div className="flex h-[340px] flex-col items-center justify-center gap-2">
                <div className="h-48 w-48 overflow-hidden rounded-2xl bg-slate-100 shadow-inner">
                  <img
                    src={src}
                    alt="Aperçu du rendu CV"
                    draggable={false}
                    style={{
                      objectPosition: `${ox}% ${oy}%`,
                      transform: `rotate(${rotation}deg) scale(${scale})`,
                    }}
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Glissez la fenêtre pour cadrer — molette pour zoomer
                </p>
                <p className="text-xs text-slate-400">Aperçu du rendu sur le CV</p>
              </div>
            )}
          </div>
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center rounded-b-2xl bg-slate-900/40 text-sm font-medium text-white">
              Import…
            </div>
          )}
        </div>

        {src && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
            <div className="flex flex-wrap items-center gap-1">
              <div className="flex items-center gap-1 rounded-lg border border-slate-300 p-0.5">
                <button
                  type="button"
                  onClick={() => zoom(-0.25)}
                  disabled={scale <= MIN_SCALE}
                  aria-label="Zoom arrière"
                  className="rounded px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() => setScale(stored.scale)}
                  disabled={scale === stored.scale}
                  title="Réinitialiser le zoom"
                  className="w-14 rounded px-1 py-1 text-center text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                  {Math.round(scale * 100)} %
                </button>
                <button
                  type="button"
                  onClick={() => zoom(0.25)}
                  disabled={scale >= MAX_SCALE}
                  aria-label="Zoom avant"
                  className="rounded px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                  ＋
                </button>
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-slate-300 p-0.5">
                <button
                  type="button"
                  onClick={() => rotate(-90)}
                  aria-label="Pivoter à gauche"
                  className="rounded px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  ⟲
                </button>
                <button
                  type="button"
                  onClick={() => setRotation(stored.rotation)}
                  disabled={rotation === stored.rotation}
                  title="Réinitialiser la rotation"
                  className="w-12 rounded px-1 py-1 text-center text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                  {Math.round(rotation)}°
                </button>
                <button
                  type="button"
                  onClick={() => rotate(90)}
                  aria-label="Pivoter à droite"
                  className="rounded px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  ⟳
                </button>
              </div>
              <button
                type="button"
                onClick={resetAll}
                disabled={!dirty}
                title="Rétablir le cadrage enregistré"
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                ↺
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
              />
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
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmTransforms}
                disabled={!dirty || busy}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
              >
                Confirmer
              </button>
            </div>
          </div>
        )}

        {error && <p className="border-t border-slate-200 px-4 py-2 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  )
}