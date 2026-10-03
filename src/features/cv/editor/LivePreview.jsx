import { useEffect, useMemo, useRef, useState } from 'react'

const PAGE_WIDTH = 794
const PAGE_HEIGHT = 1123

/* `page-break-before` / `break-before` ne s'appliquent qu'en média paginé
   (impression) : dans l'iframe d'aperçu, média `screen`, Chromium les ignore
   et le saut de page est invisible. On le rend donc explicite à l'écran. */
const PREVIEW_CSS = `<style data-live-preview>
@media screen {
  .page-break {
    page-break-before: auto !important;
    break-before: auto !important;
    height: auto !important;
    margin: 24px 0 !important;
    border-top: 2px dashed #f59e0b;
    position: relative;
  }
  .page-break::after {
    content: "Saut de page";
    position: absolute;
    top: -0.75em;
    left: 50%;
    transform: translateX(-50%);
    padding: 2px 10px;
    background: #ffffff;
    color: #b45309;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    white-space: nowrap;
  }
}
</style>`

function withPreviewCss(html) {
  if (!html) return html
  if (html.includes('</head>')) return html.replace('</head>', `${PREVIEW_CSS}</head>`)
  return PREVIEW_CSS + html
}

export default function LivePreview({ html }) {
  const containerRef = useRef(null)
  const iframeRef = useRef(null)
  const [fit, setFit] = useState(true)
  const [manualZoom, setManualZoom] = useState(100)
  const [containerWidth, setContainerWidth] = useState(0)
  // Mesure liée au srcDoc qu'elle décrit : tant que l'iframe n'a pas rechargé
  // le HTML courant, on retombe sur une page A4 plutôt que d'afficher une
  // hauteur devenue obsolète.
  const [measured, setMeasured] = useState({ srcDoc: null, height: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerWidth(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const srcDoc = useMemo(() => withPreviewCss(html), [html])

  const scale = fit ? Math.max(0.2, Math.min(1, containerWidth / PAGE_WIDTH)) : manualZoom / 100

  const zoomPresets = [50, 75, 100, 125, 150]

  const stepZoom = (delta) => {
    setFit(false)
    setManualZoom((z) => Math.max(25, Math.min(250, z + delta)))
  }

  const handleLoad = () => {
    // srcDoc sans attribut sandbox : l'iframe est same-origin, son document
    // est donc lisible depuis le parent.
    const doc = iframeRef.current?.contentDocument
    if (!doc) return
    const height = Math.max(
      doc.documentElement?.scrollHeight || 0,
      doc.body?.scrollHeight || 0,
    )
    setMeasured({ srcDoc, height })
  }

  const contentHeight =
    measured.srcDoc === srcDoc && measured.height > PAGE_HEIGHT ? measured.height : PAGE_HEIGHT
  const pageCount = Math.max(1, Math.ceil(contentHeight / PAGE_HEIGHT))

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-[#fbfaf7] px-4 py-2.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => stepZoom(-10)}
            className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-900"
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
                !fit && manualZoom === z ? 'bg-indigo-100 font-semibold text-indigo-700' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {z}%
            </button>
          ))}
          <button
            type="button"
            onClick={() => stepZoom(10)}
            className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-900"
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
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium ${
              pageCount > 1 ? 'text-amber-700' : 'text-slate-400'
            }`}
            title="Estimation sur la base de la hauteur du contenu, sans pagination réelle"
          >
            Page 1 / {pageCount}
            {pageCount > 1 ? ' (estimé)' : ''}
          </span>
          <span className="text-xs text-slate-400">Format A4</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-[#e8e6df] p-5"
      >
        <div
          className="mx-auto"
          style={{ width: PAGE_WIDTH * scale, height: contentHeight * scale }}
        >
          <iframe
            ref={iframeRef}
            srcDoc={srcDoc || undefined}
            onLoad={handleLoad}
            title="Aperçu en direct"
            className="border-0 bg-white shadow-[0_12px_30px_rgba(51,48,43,0.18)]"
            style={{
              width: PAGE_WIDTH,
              height: contentHeight,
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