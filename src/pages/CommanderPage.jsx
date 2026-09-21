import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Footer } from '../layouts/PublicLayout'
import Button from '../components/ui/Button'
import { createWhatsAppOrder } from '../api/whatsapp'

export default function CommanderPage() {
  const [form, setForm] = useState({ name: '', phone: '', description: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState(null)

  useEffect(() => {
    if (order) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [order])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      const { data } = await createWhatsAppOrder(form)
      setOrder(data)
    } catch (err) {
      const data = err.response?.data
      if (data) setErrors(data)
      else setErrors({ name: ['Une erreur est survenue.'] })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <section className="bg-gradient-to-br from-indigo-600 to-indigo-800 py-14 text-center text-white">
        <div className="mx-auto max-w-2xl px-6">
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            Commander mon CV sur WhatsApp
          </h1>
          <p className="mt-4 text-indigo-100">
            Remplissez le formulaire : notre équipe crée votre CV, vous le
            recevez sur WhatsApp et vous payez à la livraison.
          </p>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-xl px-6">
          {order ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
              <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                Commande enregistrée
              </span>
              <h2 className="mt-3 text-xl font-bold text-slate-900">
                Référence : {order.reference}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Cliquez sur le bouton ci-dessous pour ouvrir WhatsApp avec votre
                message pré-rempli. Vous serez recontacté rapidement.
              </p>
              <a
                href={order.message_url}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-block rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700"
              >
                Ouvrir WhatsApp et envoyer le message
              </a>
              <button
                onClick={() => {
                  setOrder(null)
                  setForm({ name: '', phone: '', description: '' })
                }}
                className="mt-4 block w-full text-center text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                Passer une autre commande
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-xl border border-slate-200 bg-white p-6"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Votre nom
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="Ex : Awa Diop"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Numéro WhatsApp (avec indicatif)
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="Ex : +226 70 00 00 00"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone[0]}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Décrivez votre parcours
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="Vos études, vos expériences, le poste recherché…"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description[0]}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enregistrement…' : 'Commander mon CV'}
              </Button>
              <p className="text-center text-xs text-slate-400">
                Paiement à la livraison, hors plateforme. Aucun paiement en ligne.
              </p>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-slate-500">
            Vous préférez le créer vous-même ?{' '}
            <Link to="/creer-cv" className="font-medium text-indigo-600 hover:text-indigo-500">
              Créer mon CV en ligne
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}