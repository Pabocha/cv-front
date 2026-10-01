export const normalize = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

export const KEYWORDS = {
  fr: {
    summary: ['profil', 'resume', 'a propos', 'presentation', 'accroche', 'qui suis je'],
    experiences: [
      'experience professionnelle',
      'parcours professionnel',
      'experiences',
      'experience',
      'parcours',
      'emploi',
    ],
    educations: [
      'parcours academique',
      'formations et diplomes',
      'scolarite',
      'formations',
      'formation',
      'education',
      'diplomes',
      'diplome',
      'universite',
      'etudes',
    ],
    skills: ['savoir-faire', 'competences', 'competence', 'expertise', 'outils', 'aptitude', 'maitrise'],
    languages: ['langues', 'langue'],
    certifications: ['certifications', 'certification', 'certificat', 'attestation'],
    projects: ['realisations', 'projets', 'projet', 'portfolio'],
    interests: ['centre d interet', "centre d'interet", 'centres d interet', "centres d'interet", 'interets', 'interet', 'passions', 'passion', 'centre', 'loisir', 'hobby'],
    references: ['references', 'reference', 'referencements', 'recommandations'],
  },
  en: {
    summary: ['profile', 'summary', 'about me'],
    experiences: ['experience', 'work history', 'employment'],
    educations: ['education', 'degree', 'academic'],
    skills: ['skill', 'expertise', 'tools'],
    languages: ['language'],
    certifications: ['certification', 'certificate'],
    projects: ['project', 'portfolio'],
    interests: ['interest', 'hobbies', 'hobby'],
    references: ['references', 'reference', 'recommendations'],
  },
}

export const SECTION_KEYS = Object.keys(KEYWORDS.fr)

/**
 * Étiquettes de rubricage d'un CV : elles structurent la mise en page, jamais
 * elles ne disent ce que fait le candidat. `CONTACT` en capitales et en gras est
 * le candidat le plus tentant pour un intitulé de poste.
 */
const CV_LABELS = new Set([
  'contact',
  'contacts',
  'coordonnees',
  'coordonnées',
  'curriculum',
  'cv',
  'profil',
  'a propos',
  'a propos de moi',
  'langues',
  'competences',
  'experience',
  'experiences',
  'formation',
  'formations',
  'education',
  'educations',
  'projets',
  'references',
  'disponibilite',
  'disponibilites',
  'permis',
  'infos',
  'informations',
  'personnel',
])

/** Le texte normalisé est-il une simple étiquette de rubricage ? */
export const isCvLabel = (line) => CV_LABELS.has(normalize(cleanHeading(line)))

// Les mots-clés les plus longs d'abord : « expérience professionnelle » doit être
// testé avant « expérience », sinon le reste de la ligne est mal interprété.
const SORTED_KEYWORDS = Object.fromEntries(
  Object.entries(KEYWORDS).map(([lang, sections]) => [
    lang,
    Object.fromEntries(
      Object.entries(sections).map(([key, words]) => [
        key,
        [...words].sort((a, b) => b.length - a.length),
      ]),
    ),
  ]),
)

export function startsWithWord(n, word) {
  if (!n.startsWith(word)) return false
  const after = n[word.length] || ''
  return after === '' || 'sx'.includes(after) || /[\s,.:;()-]/.test(after)
}

// Un titre arrive rarement seul : il peut être puce, numéroté, en capitales ou
// précédé d'un possessif. On retire cette décoration avant de comparer.
const HEADING_JUNK_RE = /^[\s\d•▪●*_\-–—.:;#>|+)\]]+/
const HEADING_PREFIX_RE = /^(mes|mon|ma|the|my|our)\s+/
// Un vrai titre est court : au-delà, ce n'est plus un titre mais une phrase.
const HEADING_MAX_LEN = 48
// Ce qui suit le mot-clé doit rester un qualificatif (« PROFESSIONNELLE »), pas
// une phrase : « Présentation du projet X » n'est pas un titre de section.
const HEADING_MAX_REST_WORDS = 3
const HEADING_MAX_REST_LEN = 32
// Une continuation qui commence par un déterminant trahit une phrase :
// « Présentation du projet X » n'est pas un titre de section.
const REST_SENTENCE_RE = /^(d[el]|des?|du|pour|sur|dans|avec|entre|et|and)\b/

export function cleanHeading(line) {
  let n = normalize(line).replace(/[*_`#]+/g, ' ')
  n = n.replace(HEADING_JUNK_RE, '').trim()
  n = n.replace(HEADING_PREFIX_RE, '').trim()
  return n.replace(/[\s:：-]+$/, '')
}

/**
 * Reconnaît un titre de section à partir de son seul texte.
 * Sert de repli lorsque la typographie est indisponible (police non résolue) ou
 * quand le titre n'est ni gras ni en capitales.
 */
export function detectHeading(line, lang = 'fr') {
  const n = cleanHeading(line)
  if (!n || n.length > HEADING_MAX_LEN || n.split(/\s+/).length > 5) return null
  for (const key of SECTION_KEYS) {
    // La langue du CV n'est pas toujours connue ni correcte : un titled
    // « EXPERIENCE » se rencontre dans un CV français. On essaie donc la langue
    // demandée, puis les autres — sans cela, la moitié des rubriques disparaît.
    for (const candidate of langFallbacks(lang)) {
      const words = SORTED_KEYWORDS[candidate]?.[key] || []
      for (const word of words) {
        if (!startsWithWord(n, word)) continue
        const rest = n.slice(word.length).trim()
        if (
          rest.split(/\s+/).length <= HEADING_MAX_REST_WORDS &&
          rest.length <= HEADING_MAX_REST_LEN &&
          !REST_SENTENCE_RE.test(rest)
        ) {
          return key
        }
      }
    }
  }
  return null
}

/** Langue demandée d'abord, puis toutes les autres. */
function langFallbacks(lang) {
  const others = Object.keys(SORTED_KEYWORDS).filter((key) => key !== lang)
  return [lang, ...others].filter((key) => SORTED_KEYWORDS[key])
}
