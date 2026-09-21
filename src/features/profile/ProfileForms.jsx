import { useEffect, useState } from 'react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { mediaUrl } from '../../utils/media'
import { useProfileMutation } from './hooks'

function useSavableForm(profile, fields) {
  const [form, setForm] = useState({})
  const [saved, setSaved] = useState(false)
  const mutation = useProfileMutation()

  useEffect(() => {
    if (profile) {
      const initial = fields.reduce(
        (acc, f) => ({ ...acc, [f]: profile[f] ?? '' }),
        {},
      )
      setForm(initial)
    }
  }, [profile, fields])

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const save = async (extra = {}) => {
    setSaved(false)
    try {
      await mutation.mutateAsync({ ...form, ...extra })
      setSaved(true)
    } catch {
      /* erreur gérée par l'état mutation */
    }
  }

  return { form, set, save, mutation, saved }
}

const PERSONAL_FIELDS = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'city',
  'country',
  'address',
  'linkedin',
  'github',
  'portfolio',
  'website',
]

export function PersonalInfoForm({ profile }) {
  const { form, set, save, mutation, saved } = useSavableForm(profile, PERSONAL_FIELDS)
  const [photo, setPhoto] = useState(null)

  const handleSave = () => {
    if (photo) {
      const data = new FormData()
      PERSONAL_FIELDS.forEach((f) => data.append(f, form[f] ?? ''))
      data.append('photo', photo)
      save(data)
    } else {
      save()
    }
  }

  return (
    <Section title="Informations personnelles">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input id="first_name" label="Prénom" value={form.first_name ?? ''} onChange={(e) => set('first_name', e.target.value)} />
        <Input id="last_name" label="Nom" value={form.last_name ?? ''} onChange={(e) => set('last_name', e.target.value)} />
        <Input id="email" label="Email" type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
        <Input id="phone" label="Téléphone" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
        <Input id="city" label="Ville" value={form.city ?? ''} onChange={(e) => set('city', e.target.value)} />
        <Input id="country" label="Pays" value={form.country ?? ''} onChange={(e) => set('country', e.target.value)} />
        <div className="sm:col-span-2">
          <Input id="address" label="Adresse (optionnel)" value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} />
        </div>
        <Input id="linkedin" label="LinkedIn" type="url" value={form.linkedin ?? ''} onChange={(e) => set('linkedin', e.target.value)} />
        <Input id="github" label="GitHub" type="url" value={form.github ?? ''} onChange={(e) => set('github', e.target.value)} />
        <Input id="portfolio" label="Portfolio" type="url" value={form.portfolio ?? ''} onChange={(e) => set('portfolio', e.target.value)} />
        <Input id="website" label="Site web" type="url" value={form.website ?? ''} onChange={(e) => set('website', e.target.value)} />
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-slate-700">Photo (optionnel)</label>
        {profile?.photo && (
          <img
            src={mediaUrl(profile.photo)}
            alt="Aperçu"
            className="mt-2 h-20 w-20 rounded-full object-cover"
          />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhoto(e.target.files[0] || null)}
          className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
        />
      </div>
      <SaveBar saving={mutation.isPending} saved={saved} onSave={handleSave} error={mutation.error} />
    </Section>
  )
}

const PROFESSIONAL_FIELDS = ['professional_title', 'summary', 'target_job', 'field']

export function ProfessionalProfileForm({ profile }) {
  const { form, set, save, mutation, saved } = useSavableForm(profile, PROFESSIONAL_FIELDS)

  return (
    <Section title="Profil professionnel">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          id="professional_title"
          label="Titre professionnel"
          placeholder="Ex. Développeuse web"
          value={form.professional_title ?? ''}
          onChange={(e) => set('professional_title', e.target.value)}
        />
        <Input
          id="field"
          label="Domaine"
          placeholder="Ex. Informatique"
          value={form.field ?? ''}
          onChange={(e) => set('field', e.target.value)}
        />
        <div className="sm:col-span-2">
          <Input
            id="target_job"
            label="Poste recherché"
            placeholder="Ex. Ingénieure logicielle"
            value={form.target_job ?? ''}
            onChange={(e) => set('target_job', e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="summary" className="block text-sm font-medium text-slate-700">
            Résumé / profil
          </label>
          <textarea
            id="summary"
            rows={4}
            value={form.summary ?? ''}
            onChange={(e) => set('summary', e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      <SaveBar saving={mutation.isPending} saved={saved} onSave={save} error={mutation.error} />
    </Section>
  )
}

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function SaveBar({ saving, saved, onSave, error }) {
  return (
    <div className="mt-4 flex items-center gap-3">
      <Button onClick={onSave} disabled={saving}>
        {saving ? 'Enregistrement...' : 'Enregistrer'}
      </Button>
      {saved && <span className="text-sm text-green-600">Enregistré ✓</span>}
      {error && <span className="text-sm text-red-600">Erreur lors de l'enregistrement.</span>}
    </div>
  )
}