import { Link } from 'react-router-dom'
import { useCvs, useDeleteCv } from './useCvs'
import Button from '../../components/ui/Button'

export default function CvListPage() {
  const { data: cvs, isLoading } = useCvs()
  const deleteCv = useDeleteCv()

  const handleDelete = (id) => {
    if (window.confirm('Supprimer ce CV ?')) {
      deleteCv.mutate(id)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        Chargement…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mes CV</h1>
          <p className="mt-1 text-sm text-slate-500">
            {cvs?.length || 0} CV{cvs?.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/cv/new">
          <Button>+ Nouveau CV</Button>
        </Link>
      </div>

      {!cvs?.length && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-500">
            Vous n'avez pas encore de CV.
          </p>
          <Link to="/cv/new" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline">
            Créer mon premier CV
          </Link>
        </div>
      )}

      <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {cvs?.map((cv) => (
          <div
            key={cv.id}
            className="flex items-center justify-between px-5 py-4"
          >
            <Link to={`/cv/${cv.id}`} className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-900 hover:text-indigo-600">
                {cv.title}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Template : {cv.template}
                {cv.target_job && ` · ${cv.target_job}`}
                {' · '}
                <span
                  className={
                    cv.status === 'generated'
                      ? 'font-medium text-green-700'
                      : 'text-slate-400'
                  }
                >
                  {cv.status === 'generated' ? 'Généré' : 'Brouillon'}
                </span>
              </p>
            </Link>
            <div className="ml-4 flex gap-2">
              <Link to={`/cv/${cv.id}`}>
                <Button variant="secondary" className="text-xs">
                  Ouvrir
                </Button>
              </Link>
              <Button
                variant="danger"
                className="text-xs"
                onClick={() => handleDelete(cv.id)}
                disabled={deleteCv.isPending}
              >
                Supprimer
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
