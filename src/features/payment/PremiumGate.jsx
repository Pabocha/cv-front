import { useState } from 'react'
import Button from '../../components/ui/Button'
import { useEntitlements } from './usePayments'
import PaywallModal from './PaywallModal'

export default function PremiumGate({
  children,
  title = 'Fonctionnalité Premium',
  message = 'Cette fonctionnalité est réservée aux abonnés Premium.',
}) {
  const { data: entitlements, isLoading } = useEntitlements()
  const [modalOpen, setModalOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="py-8 text-center text-sm text-slate-400">Chargement…</div>
    )
  }

  if (entitlements?.is_premium) {
    return children
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
      <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
        Premium
      </span>
      <h2 className="mt-3 text-lg font-bold text-slate-900">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{message}</p>
      <Button className="mt-4" onClick={() => setModalOpen(true)}>
        Débloquer avec Premium
      </Button>
      <PaywallModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={title}
        message={message}
        onSuccess={() => setModalOpen(false)}
      />
    </div>
  )
}