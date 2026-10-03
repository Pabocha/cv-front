import { useEffect, useMemo, useRef, useState } from 'react'

const PAGE_WIDTH = 794
const PAGE_HEIGHT = 1123
const MIN_ZOOM = 25
const MAX_ZOOM = 250

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

/* `startFit` / `startZoom` fixent l'état initial du zoom : la vue agrandie
   démarre en manuel à 100 % (le mode « Ajuster »_descenderait sous 100 % sur
   une fenêtre étroite, ce qui n'est pas une base). `center` centre le CV dans
   les deux sens. */
export default function LivePreview({ html, startFit = true, startZoom = 100, center = false }) {
  const containerRef = useRef(null)
  const iframeRef = useRef(null)
  const [fit, setFit] = useState(startFit)
  const [manualZoom, setManualZoom] = useState(startZoom)
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

  // La valeur affichée est toujours le zoom réel : en mode « Ajuster » elle suit
  // la largeur du conteneur, et le curseur reflète cette valeur sans qu'elle
  // devienne une consigne de zoom.
  const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(scale * 100)))

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

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-slate-200/80 bg-[#fbfaf7] px-4 py-2.5">
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={5}
          value={zoom}
          onChange={(e) => {
            setFit(false)
            setManualZoom(Number(e.target.value))
          }}
          aria-label="Zoom de l'aperçu"
          className="h-1.5 w-40 cursor-pointer accent-indigo-600"
        />
        <span className="w-10 text-right text-xs tabular-nums text-slate-500">{zoom} %</span>
        <label className="flex items-center gap-1.5 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={fit}
            onChange={(e) => setFit(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300"
          />
          Ajuster
        </label>
      </div>

      {/* Centrage par `margin: auto` et non par `align-items: center` : quand le
          CV dépasse la hauteur, ce dernier le positionne centré hors du conteneur
          et le haut devient non atteignable au défilement, alors que les marges
          auto retombent à 0 et laissent défiler normalement. */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-auto bg-[#e8e6df] p-3 ${center ? 'flex flex-col' : ''}`}
      >
        <div
          className={`shrink-0 ${center ? 'm-auto' : 'mx-auto'}`}
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
          <p className={`mt-4 shrink-0 text-center text-sm text-slate-400 ${center ? 'w-full' : ''}`}>
            Modifiez votre contenu pour voir l'aperçu apparaître ici.
          </p>
        )}
      </div>
    </div>
  )
}