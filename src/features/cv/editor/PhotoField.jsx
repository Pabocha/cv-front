import { useState } from 'react'
import { cvPhotoUrl } from '../../../utils/media'
import PhotoModal from './PhotoModal'

export default function PhotoField({ value, onChange, cvId }) {
  const [open, setOpen] = useState(false)
  const src = cvPhotoUrl(value)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={src ? 'Cliquer pour zoomer' : 'Ajouter une photo'}
        className="block h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-300 bg-slate-100 shadow-sm transition hover:ring-2 hover:ring-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {src ? (
          <img
            src={src}
            alt="Photo du CV"
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-slate-400">
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
          </span>
        )}
      </button>
      <PhotoModal
        key={open ? 'open' : 'closed'}
        open={open}
        src={src}
        cvId={cvId}
        onChange={onChange}
        onClose={() => setOpen(false)}
      />
    </div>
  )
}