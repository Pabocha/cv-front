export const SECTION_CONFIGS = {
  experiences: {
    title: 'Expériences',
    emptyText: 'Ajoutez vos expériences professionnelles.',
    titleField: 'position',
    subtitleField: 'company',
    fields: [
      { name: 'company', label: 'Entreprise', required: true, section: 'left' },
      { name: 'position', label: 'Poste', required: true, section: 'right' },
      { name: 'location', label: 'Localisation' },
      { name: 'date_start', label: 'Date de début', type: 'date' },
      { name: 'date_end', label: 'Date de fin', type: 'date', hideWhen: 'is_current' },
      { name: 'is_current', label: 'Poste actuel', type: 'checkbox' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'achievements', label: 'Réalisations', type: 'textarea' },
    ],
  },
  educations: {
    title: 'Formations',
    emptyText: 'Ajoutez vos formations.',
    titleField: 'degree',
    subtitleField: 'institution',
    fields: [
      { name: 'institution', label: 'Établissement', required: true, section: 'left' },
      { name: 'degree', label: 'Diplôme', required: true, section: 'right' },
      { name: 'field_of_study', label: 'Domaine d’étude' },
      { name: 'date_start', label: 'Date de début', type: 'date' },
      { name: 'date_end', label: 'Date de fin', type: 'date' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  skills: {
    title: 'Compétences',
    emptyText: 'Ajoutez vos compétences.',
    titleField: 'name',
    fields: [
      { name: 'name', label: 'Compétence', required: true, section: 'left' },
      { name: 'level', label: 'Niveau', section: 'right' },
      { name: 'category', label: 'Catégorie' },
    ],
  },
  languages: {
    title: 'Langues',
    emptyText: 'Ajoutez vos langues.',
    titleField: 'name',
    fields: [
      { name: 'name', label: 'Langue', required: true, section: 'left' },
      { name: 'level', label: 'Niveau', section: 'right' },
    ],
  },
  certifications: {
    title: 'Certifications',
    emptyText: 'Ajoutez vos certifications.',
    titleField: 'name',
    fields: [
      { name: 'name', label: 'Certification', required: true, section: 'left' },
      { name: 'issuer', label: 'Organisme', section: 'right' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'url', label: 'Lien', type: 'url' },
    ],
  },
  projects: {
    title: 'Projets',
    emptyText: 'Ajoutez vos projets.',
    titleField: 'name',
    fields: [
      { name: 'name', label: 'Nom du projet', required: true, section: 'left' },
      { name: 'technologies', label: 'Technologies', section: 'right' },
      { name: 'url', label: 'Lien', type: 'url' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  interests: {
    title: 'Centres d’intérêt',
    emptyText: 'Ajoutez vos centres d’intérêt.',
    titleField: 'text',
    fields: [{ name: 'text', label: 'Centre d’intérêt', required: true }],
  },
}

export const ALL_SECTIONS = Object.keys(SECTION_CONFIGS)