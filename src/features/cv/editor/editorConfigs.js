export const SECTION_ORDER = [
  'summary',
  'experiences',
  'educations',
  'skills',
  'languages',
  'certifications',
  'projects',
  'interests',
]

export const SIDEBAR_SECTIONS = ['skills', 'languages', 'certifications']

export const TWO_COL_TEMPLATES = ['moderne', 'ingenieur', 'colorful']

export const SECTION_LABELS = {
  fr: {
    summary: 'Profil',
    experiences: 'Expériences professionnelles',
    educations: 'Formation',
    skills: 'Compétences',
    languages: 'Langues',
    certifications: 'Certifications',
    projects: 'Projets',
    interests: "Centres d'intérêt",
    contact: 'Contact',
  },
  en: {
    summary: 'Profile',
    experiences: 'Professional Experience',
    educations: 'Education',
    skills: 'Skills',
    languages: 'Languages',
    certifications: 'Certifications',
    projects: 'Projects',
    interests: 'Interests',
    contact: 'Contact',
  },
}

export const HEADER_FIELDS = [
  { name: 'full_name', label: 'Nom complet' },
  { name: 'title', label: 'Intitulé du poste' },
  { name: 'email', label: 'Email' },
  { name: 'phone', label: 'Téléphone' },
  { name: 'city', label: 'Ville' },
  { name: 'country', label: 'Pays' },
  { name: 'address', label: 'Adresse' },
  { name: 'linkedin', label: 'LinkedIn' },
  { name: 'github', label: 'GitHub' },
  { name: 'portfolio', label: 'Portfolio' },
  { name: 'website', label: 'Site web' },
  { name: 'photo', label: 'Photo' },
]

export const SECTION_FIELD_CONFIGS = {
  experiences: {
    titleField: 'position',
    subtitleField: 'company',
    emptyText: 'Ajoutez vos expériences professionnelles.',
    fields: [
      { name: 'position', label: 'Poste', required: true },
      { name: 'company', label: 'Entreprise', required: true },
      { name: 'location', label: 'Localisation' },
      { name: 'date_range', label: 'Période', type: 'period' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'achievements', label: 'Réalisations', type: 'textarea' },
    ],
  },
  educations: {
    titleField: 'degree',
    subtitleField: 'institution',
    emptyText: 'Ajoutez vos formations.',
    fields: [
      { name: 'degree', label: 'Diplôme', required: true },
      { name: 'institution', label: 'Établissement', required: true },
      { name: 'field_of_study', label: "Domaine d'étude" },
      { name: 'date_range', label: 'Période', type: 'period', currentLabel: 'En cours' },
    ],
  },
  skills: {
    titleField: 'name',
    subtitleField: 'level',
    emptyText: 'Ajoutez vos compétences.',
    fields: [
      { name: 'name', label: 'Compétence', required: true },
      { name: 'level', label: 'Niveau' },
      { name: 'category', label: 'Catégorie' },
    ],
  },
  languages: {
    titleField: 'name',
    subtitleField: 'level',
    emptyText: 'Ajoutez vos langues.',
    fields: [
      { name: 'name', label: 'Langue', required: true },
      { name: 'level', label: 'Niveau' },
    ],
  },
  certifications: {
    titleField: 'name',
    subtitleField: 'issuer',
    emptyText: 'Ajoutez vos certifications.',
    fields: [
      { name: 'name', label: 'Certification', required: true },
      { name: 'issuer', label: 'Organisme' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'url', label: 'Lien', type: 'url' },
    ],
  },
  projects: {
    titleField: 'name',
    subtitleField: 'technologies',
    emptyText: 'Ajoutez vos projets.',
    fields: [
      { name: 'name', label: 'Nom du projet', required: true },
      { name: 'technologies', label: 'Technologies' },
      { name: 'url', label: 'Lien', type: 'url' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },
}

export const DEFAULT_ACCENTS = {
  professionnel: '#4f46e5',
  moderne: '#6366f1',
  elegant: '#334e68',
  executif: '#c9a227',
  ingenieur: '#0d9488',
  colorful: '#7c3aed',
}

export const ACCENT_PALETTE = [
  '#4f46e5',
  '#6366f1',
  '#0d9488',
  '#7c3aed',
  '#c9a227',
  '#db2777',
  '#0891b2',
  '#16a34a',
  '#ea580c',
  '#334e68',
  '#be123c',
  '#a855f7',
]

export const FONT_PRESETS = [
  { label: 'Moderne', value: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  { label: 'Classique', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Écriture', value: '"Cambria", Georgia, serif' },
  { label: 'Arial', value: 'Arial, "Helvetica Neue", sans-serif' },
  { label: 'Times', value: '"Times New Roman", Times, serif' },
  { label: 'Monospace', value: 'Consolas, "SF Mono", Menlo, monospace' },
]

export const FONT_SIZES = ['8px', '9px', '10px', '11px', '12px', '13px', '14px']

export const LINE_HEIGHTS = ['1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '1.9']

export const COLOR_MODES = [
  { value: 'accents', label: 'Accents seuls' },
  { value: 'band', label: 'Bandeau' },
  { value: 'full', label: 'Bandeau + latérale' },
]

export const BACKGROUNDS = [
  { value: 'none', label: 'Aucun' },
  { value: 'dots', label: 'Pointillés' },
  { value: 'ruled', label: 'Traces' },
  { value: 'grid', label: 'Quadrillage' },
  { value: 'stripes', label: 'Rayures' },
  { value: 'gradient', label: 'Dégradé' },
]

const BASE_STYLE = {
  accent_color: '#4f46e5',
  font: FONT_PRESETS[0].value,
  font_size: '10px',
  line_height: '1.5',
  color_mode: 'accents',
  background: 'none',
}

export const ELEGANT_FONT = FONT_PRESETS[1].value

export function defaultLayoutFor(slug) {
  const side = SIDEBAR_SECTIONS
  if (TWO_COL_TEMPLATES.includes(slug)) {
    const main = ['summary', 'experiences', 'educations', 'projects', 'interests']
    return {
      sections: [...main, ...side].map((key) => ({
        key,
        column: main.includes(key) ? 'main' : 'sidebar',
        visible: true,
      })),
      page_breaks: [],
    }
  }
  return {
    sections: SECTION_ORDER.map((key) => ({
      key,
      column: 'main',
      visible: true,
    })),
    page_breaks: [],
  }
}

export function normalizeEditorLayout(layout, slug) {
  const fallback = defaultLayoutFor(slug)
  if (!layout || typeof layout !== 'object') return fallback
  const raw = Array.isArray(layout.sections) ? layout.sections : []
  if (!raw.length) return fallback

  const sections = []
  const seen = new Set()
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const { key } = item
    if (!SECTION_ORDER.includes(key) || seen.has(key)) continue
    seen.add(key)
    sections.push({
      key,
      column: item.column === 'sidebar' ? 'sidebar' : 'main',
      visible: item.visible !== false,
    })
  }
  for (const key of SECTION_ORDER) {
    if (seen.has(key)) continue
    sections.push({
      key,
      column:
        TWO_COL_TEMPLATES.includes(slug) && SIDEBAR_SECTIONS.includes(key)
          ? 'sidebar'
          : 'main',
      visible: true,
    })
  }

  const pageBreaks = Array.isArray(layout.page_breaks)
    ? layout.page_breaks.filter((k) => SECTION_ORDER.includes(k))
    : []

  return {
    sections,
    page_breaks: pageBreaks,
  }
}

export function defaultStyleFor(slug, partial) {
  const base = {
    ...BASE_STYLE,
    accent_color: DEFAULT_ACCENTS[slug] || BASE_STYLE.accent_color,
    font: slug === 'elegant' ? ELEGANT_FONT : BASE_STYLE.font,
  }
  if (!partial || typeof partial !== 'object') return base
  return { ...base, ...partial }
}

export const MONTH_NAMES = {
  fr: [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ],
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
}

export function yearOptions(from = new Date().getFullYear() - 50, to = new Date().getFullYear() + 1) {
  const years = []
  for (let y = to; y >= from; y -= 1) years.push(y)
  return years
}

export function composePeriod(value, lang = 'fr') {
  const v = value || {}
  const names = MONTH_NAMES[lang] || MONTH_NAMES.fr
  const start = composePart(v.startMonth, v.startYear, names)
  if (v.current) {
    const marker = lang === 'en' ? 'Present' : "Aujourd'hui"
    return start ? `${start} - ${marker}` : marker
  }
  const end = composePart(v.endMonth, v.endYear, names)
  if (!start && !end) return ''
  return start && end ? `${start} - ${end}` : start || end
}

export function composeDate(value, lang = 'fr') {
  const names = MONTH_NAMES[lang] || MONTH_NAMES.fr
  return composePart(value?.month, value?.year, names)
}

export function parsePeriod(value) {
  const empty = { startMonth: '', startYear: '', endMonth: '', endYear: '', current: false }
  if (!value || typeof value !== 'string') return empty
  const parts = value.split(/\s*-\s*/).filter(Boolean)
  const start = parsePart(parts[0])
  const current = /aujourd|today|present|actuel/i.test(value)
  let end = { month: '', year: '' }
  if (!current && parts.length > 1) end = parsePart(parts[1])
  return { ...start, ...end, current }
}

export function parseDate(value) {
  if (!value || typeof value !== 'string') return { month: '', year: '' }
  return parsePart(value)
}

function parsePart(part) {
  const result = { month: '', year: '' }
  if (!part) return result
  const yearMatch = part.match(/\b(19\d{2}|20\d{2})\b/)
  if (yearMatch) result.year = yearMatch[1]
  const lower = part.toLowerCase()
  for (let i = 0; i < 12; i += 1) {
    if (lower.includes(MONTH_NAMES.fr[i].toLowerCase()) || lower.includes(MONTH_NAMES.en[i].toLowerCase())) {
      result.month = String(i + 1)
      break
    }
  }
  return result
}

function composePart(month, year, names) {
  const m = month ? names[Number(month) - 1] : ''
  if (m && year) return `${m} ${year}`
  return m || year || ''
}