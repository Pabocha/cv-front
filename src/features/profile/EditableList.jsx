import { useState } from 'react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

const EMPTY = {}

function toDateInput(value) {
  return value ? value.slice(0, 10) : ''
}

export default function EditableList({
  items,
  fields,
  titleField,
  subtitleField,
  title,
  emptyText,
  loading,
  error,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const startCreate = () => {
    setEditingId(null)
    setForm(EMPTY)
    setFormError('')
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setForm(item)
    setFormError('')
  }

  const cancel = () => {
    setEditingId(null)
    setForm(null)
    setFormError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const requiredMissing = fields
      .filter((f) => f.required)
      .some((f) => !(form[f.name] ?? '').toString().trim())
    if (requiredMissing) {
      setFormError('Veuillez remplir les champs obligatoires.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const payload = fields.reduce((acc, f) => {
        let value = form[f.name] ?? ''
        if (f.type === 'checkbox') value = !!value
        else if (value === '') value = null
        return { ...acc, [f.name]: value }
      }, {})
      if (editingId) await onUpdate(editingId, payload)
      else await onCreate(payload)
      cancel()
    } catch (err) {
      const data = err.response?.data
      if (data) setFormError(JSON.stringify(data))
      else setFormError("Une erreur est survenue. Réessayez.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {items.length === 0 && emptyText && (
            <p className="mt-1 text-sm text-slate-500">{emptyText}</p>
          )}
        </div>
        {!form && (
          <Button variant="secondary" onClick={startCreate}>
            + Ajouter
          </Button>
        )}
      </div>

      {loading && <p className="mt-4 text-sm text-slate-500">Chargement...</p>}
      {!loading && error && (
        <p className="mt-4 text-sm text-red-600">Erreur de chargement.</p>
      )}

      {items.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {item[titleField]}
                </p>
                {subtitleField && item[subtitleField] && (
                  <p className="truncate text-sm text-slate-500">{item[subtitleField]}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="text-xs" onClick={() => startEdit(item)}>
                  Modifier
                </Button>
                <Button
                  variant="danger"
                  className="text-xs"
                  onClick={() => {
                    if (window.confirm('Supprimer cet élément ?')) onDelete(item.id)
                  }}
                >
                  Supprimer
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {form && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {fields
              .filter((f) => f.type !== 'checkbox')
              .map((f) => {
                const hidden = f.hideWhen && form[f.hideWhen]
                return (
                  <div key={f.name} className={hidden ? 'hidden' : ''}>
                    <Input
                      id={`${titleField}-${f.name}`}
                      label={f.label}
                      type={f.type || 'text'}
                      required={f.required}
                      value={
                        f.type === 'date' ? toDateInput(form[f.name]) : form[f.name] ?? ''
                      }
                      onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    />
                  </div>
                )
              })}
          </div>
          {fields
            .filter((f) => f.type === 'checkbox')
            .map((f) => (
              <label key={f.name} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={!!form[f.name]}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {f.label}
              </label>
            ))}
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Enregistrement...' : editingId ? 'Enregistrer' : 'Ajouter'}
            </Button>
            <Button type="button" variant="secondary" onClick={cancel}>
              Annuler
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}