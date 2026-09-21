import { useEffect } from 'react'
import Button from '../../components/ui/Button'
import { useSubscribe } from './usePayments'

export default function PaywallModal({
  open,
  onClose,
  title = 'Fonctionnalité Premium',
  message = 'Cette fonctionnalité est réservée aux abonnés Premium. Activez une offre pour en profiter.',
  onSuccess,
}) {
  const subscribe = useSubscribe()

  useEffect(() => {
    if (open) {
      subscribe.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  const handleSubscribe = async () => {
    await subscribe.mutateAsync('premium')
    onSuccess?.()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            Premium
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{message}</p>

        <div className="mt-5 space-y-3">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Abonnement Premium</p>
                <p className="text-sm text-slate-500">
                  Création et génération de CV, tous les modèles, PDF illimités,
                  ATS, adaptation et lettres de motivation.
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-indigo-700">3 000 FCFA</p>
                <p className="text-xs text-slate-500">/ mois</p>
              </div>
            </div>
            <Button
              className="mt-3 w-full"
              onClick={handleSubscribe}
              disabled={subscribe.isPending}
            >
              {subscribe.isPending
                ? 'Activation…'
                : 'Activer Premium maintenant'}
            </Button>
          </div>

          <a
            href="/pricing"
            className="block rounded-xl border border-slate-200 p-4 text-center hover:bg-slate-50"
          >
            <p className="text-sm font-medium text-indigo-600">
              Comparer les options (Premium+…)
            </p>
          </a>
        </div>

        {subscribe.isError && (
          <p className="mt-3 text-sm text-red-600">
            {subscribe.error?.response?.data?.detail ||
              'Une erreur est survenue.'}
          </p>
        )}

        <p className="mt-4 text-center text-xs text-slate-400">
          Démo : le paiement est simulé instantanément.
        </p>
        <button
          onClick={onClose}
          className="mt-2 block w-full text-center text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}