import { useRef, useState } from 'react'
import { uploadCvPhoto } from '../../../api/cvs'
import { getProfile } from '../../../api/profile'
import { cvPhotoUrl } from '../../../utils/media'

export default function PhotoField({ value, onChange, cvId }) {
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !cvId) return
    setBusy(true)
    setError('')
    try {
      const { data } = await uploadCvPhoto(cvId, file)
      onChange(data.photo)
    } catch (err) {
      setError(err?.response?.data?.detail || "Impossible d'importer la photo.")
    } finally {
      setBusy(false)
    }
  }

  const useProfilePhoto = async () => {
    setBusy(true)
    setError('')
    try {
      const { data } = await getProfile()
      if (data?.photo) onChange(cvPhotoUrl(data.photo))
      else setError('Aucune photo de profil enregistrée.')
    } catch {
      setError('Impossible de récupérer votre photo de profil.')
    } finally {
      setBusy(false)
    }
  }

  const src = cvPhotoUrl(value)

  return (
    <div>
      <div className="flex flex-wrap items-start gap-3">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-300 bg-slate-100">
          {src ? (
            <img
              src={src}
              alt="Photo du CV"
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-9 w-9"
                aria-hidden
              >
                <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                <path d="M4 20c0-3.3 3.6-5 8-5s8 1.7 8 5" />
              </svg>
            </div>
          )}
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 text-xs font-medium text-slate-600">
              Import…
            </div>
          )}
        </div>

        <div className="flex min-w-[200px] flex-col gap-2">
          <div className="flex flex-wrap gap-2">
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
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none disabled:opacity-50"
            >
              Importer une photo
            </button>
            <button
              type="button"
              onClick={useProfilePhoto}
              disabled={busy}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none disabled:opacity-50"
            >
              Ma photo de profil
            </button>
            {value ? (
              <button
                type="button"
                onClick={() => onChange('')}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-red-600 focus:outline-none"
              >
                Retirer
              </button>
            ) : null}
          </div>
          <input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="ou URL de l'image (optionnel)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}