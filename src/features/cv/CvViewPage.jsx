import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCv, useGenerateCv, usePdfCv } from './useCvs'
import { useEntitlements } from '../payment/usePayments'
import { previewCv } from '../../api/cvs'
import Button from '../../components/ui/Button'

export default function CvViewPage() {
  const { id } = useParams()
  const { data: cv, isLoading } = useCv(id)
  const generate = useGenerateCv()
  const downloadPdf = usePdfCv()
  const { data: entitlements } = useEntitlements()
  const iframeRef = useRef(null)
  const [previewHtml, setPreviewHtml] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  // L'export n'est jamais refusé : le quota de PDF propres restants décide
  // seulement si le fichier porte un filigrane.
  const cleanRemaining = entitlements?.clean_pdfs_remaining
  const unlimited = cleanRemaining === null
  const cleanLeft = typeof cleanRemaining === 'number' ? cleanRemaining : null
  const lastPdfWasWatermarked = downloadPdf.data?.watermarked === true

  const handlePreview = async () => {
    setPreviewLoading(true)
    try {
      const { data } = await previewCv(id)
      setPreviewHtml(data)
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleGenerate = async () => {
    const hasContent = cv.status !== 'draft'
    if (
      hasContent &&
      !window.confirm(
        'Générer à nouveau remplacera votre contenu actuel (y compris vos modifications personnalisées) par le contenu issu de votre profil. Continuer ?',
      )
    ) {
      return
    }
    await generate.mutateAsync(id)
    setPreviewHtml(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        Chargement…
      </div>
    )
  }

  if (!cv) {
    return (
      <div className="py-20 text-center text-slate-500">CV introuvable.</div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{cv.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Template : <span className="font-medium">{cv.template}</span>
            {cv.target_job && (
              <>
                {' · '}
                Poste visé : <span className="font-medium">{cv.target_job}</span>
              </>
            )}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            cv.status === 'generated'
              ? 'bg-green-100 text-green-800'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {cv.status === 'generated' ? 'Généré' : 'Brouillon'}
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to={`/cv/${id}/edit`}>
          <Button>Éditer le CV</Button>
        </Link>
        <Button onClick={handleGenerate} disabled={generate.isPending}>
          {generate.isPending ? 'Génération…' : 'Générer le contenu'}
        </Button>
        <Button
          variant="secondary"
          onClick={handlePreview}
          disabled={previewLoading || cv.status !== 'generated'}
        >
          {previewLoading ? 'Chargement…' : 'Prévisualiser'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => downloadPdf.mutate(id)}
          disabled={downloadPdf.isPending || cv.status !== 'generated'}
        >
          {downloadPdf.isPending ? 'Téléchargement…' : 'Télécharger PDF'}
        </Button>
        <Link to={`/cv/${id}/ats`}>
          <Button variant="secondary">Analyse ATS</Button>
        </Link>
        <Link to={`/cv/${id}/adapt`}>
          <Button variant="secondary">Adapter à une offre</Button>
        </Link>
        <Link to={`/cv/${id}/lettre`}>
          <Button variant="secondary">Lettre de motivation</Button>
        </Link>
      </div>

      {generate.isError && (
        <p className="text-sm text-red-600">
          {generate.error?.response?.data?.detail || 'Erreur lors de la génération.'}
        </p>
      )}

      <PdfQuotaNotice
        unlimited={unlimited}
        cleanLeft={cleanLeft}
        watermarked={lastPdfWasWatermarked}
      />

      {downloadPdf.isError && (
        <p className="text-sm text-red-600">
          {downloadPdf.error?.response?.data?.detail ||
            'Erreur lors du téléchargement.'}
        </p>
      )}

      {previewHtml !== null && (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
            <span className="text-sm font-medium text-slate-600">
              Aperçu du CV
            </span>
            <Button
              variant="secondary"
              onClick={() => setPreviewHtml(null)}
              className="text-xs"
            >
              Fermer
            </Button>
          </div>
          <div className="overflow-auto" style={{ maxHeight: '80vh' }}>
            <iframe
              ref={iframeRef}
              srcDoc={previewHtml}
              title="Aperçu du CV"
              className="h-[1100px] w-full border-0"
            />
          </div>
        </div>
      )}

      {cv.status === 'draft' && previewHtml === null && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Le contenu n'a pas encore été généré. Cliquez sur « Générer le contenu »
          pour créer votre CV à partir de vos informations de profil.
        </div>
      )}
    </div>
  )
}

function PdfQuotaNotice({ unlimited, cleanLeft, watermarked }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
      <p className="text-slate-600">
        {unlimited ? (
          <>Export PDF illimité, sans filigrane.</>
        ) : (
          <>
            Il vous reste{' '}
            <strong>
              {cleanLeft ?? 0} PDF sans filigrane
            </strong>{' '}
            ce mois-ci. Vos téléchargements suivants restent possibles, mais
            portent la mention « version gratuite ».
          </>
        )}
      </p>
      {watermarked && (
        <p className="mt-2 text-amber-700">
          Votre dernier PDF portait le filigrane. La marque disparaît avec
          l&apos;offre Premium.
        </p>
      )}
      {!unlimited && cleanLeft === 0 && (
        <Link to="/pricing" className="mt-2 inline-block font-medium text-indigo-600 hover:underline">
          Découvrir l&apos;offre Premium
        </Link>
      )}
    </div>
  )
}
