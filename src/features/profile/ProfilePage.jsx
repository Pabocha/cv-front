import EditableList from './EditableList'
import { PersonalInfoForm, ProfessionalProfileForm } from './ProfileForms'
import { useProfile, useSection } from './hooks'
import { SECTION_CONFIGS, ALL_SECTIONS } from './sectionConfigs'

export default function ProfilePage() {
  const { profile, isLoading, error } = useProfile()

  if (isLoading) {
    return <p className="text-sm text-slate-500">Chargement du profil...</p>
  }
  if (error) {
    return <p className="text-sm text-red-600">Erreur lors du chargement du profil.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mon profil</h1>
        <p className="mt-1 text-sm text-slate-500">
          Complétez vos informations pour créer un CV précis.
        </p>
      </div>
      <PersonalInfoForm profile={profile} />
      <ProfessionalProfileForm profile={profile} />
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-slate-900">Détails du profil</h2>
        {ALL_SECTIONS.map((kind) => (
          <SectionBlock key={kind} kind={kind} profile={profile} />
        ))}
      </div>
    </div>
  )
}

function SectionBlock({ kind, profile }) {
  const config = SECTION_CONFIGS[kind]
  const { create, update, remove } = useSection(kind)

  return (
    <EditableList
      items={profile?.[kind] ?? []}
      fields={config.fields}
      titleField={config.titleField}
      subtitleField={config.subtitleField}
      title={config.title}
      emptyText={config.emptyText}
      loading={false}
      error={null}
      onCreate={create.mutateAsync}
      onUpdate={(id, data) => update.mutateAsync({ id, data })}
      onDelete={remove.mutateAsync}
    />
  )
}