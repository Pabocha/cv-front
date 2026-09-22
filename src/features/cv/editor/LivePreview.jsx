import { useEffect, useRef, useState } from 'react'

const PAGE_WIDTH = 794
const PAGE_HEIGHT = 1123

export default function LivePreview({ html }) {
  const containerRef = useRef(null)
  const [fit, setFit] = useState(true)
  const [manualZoom, setManualZoom] = useState(100)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerWidth(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const scale = fit ? Math.max(0.2, Math.min(1, containerWidth / PAGE_WIDTH)) : manualZoom / 100

  const zoomPresets = [50, 75, 100, 125, 150]

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setManualZoom(100)}
            className="rounded px-2 py-1 text-xs hover:bg-slate-100"
          >
            −
          </button>
          {zoomPresets.map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => {
                setFit(false)
                setManualZoom(z)
              }}
              className={`rounded px-2 py-1 text-xs ${
                !fit && manualZoom === z ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {z}%
            </button>
          ))}
          <button
            type="button"
            onClick={() => setManualZoom(100)}
            className="rounded px-2 py-1 text-xs hover:bg-slate-100"
          >
            +
          </button>
          <label className="ml-2 flex items-center gap-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={fit}
              onChange={(e) => setFit(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300"
            />
            Ajuster
          </label>
        </div>
        <span className="text-xs text-slate-400">Format A4</span>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-slate-200 p-4"
      >
        <div
          className="mx-auto"
          style={{ width: PAGE_WIDTH * scale, height: PAGE_HEIGHT * scale }}
        >
          <iframe
            srcDoc={html || undefined}
            title="Aperçu en direct"
            className="border-0 bg-white shadow-md"
            style={{
              width: PAGE_WIDTH,
              height: PAGE_HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          />
        </div>
        {!html && (
          <p className="mt-4 text-center text-sm text-slate-400">
            Modifiez votre contenu pour voir l'aperçu apparaître ici.
          </p>
        )}
      </div>
    </div>
  )
}