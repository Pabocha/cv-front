import { groupItemsIntoLines } from './lines'
import { groupLinesIntoSections, lineText, PROFILE_SECTION } from './sections'
import { divideSectionIntoSubsections } from './subsections'
import { getTextWithHighestFeatureScore } from './features'
import {
  COUNTRY_FEATURE_SETS,
  DATE_FEATURE_SETS,
  EMAIL_FEATURE_SETS,
  LOCATION_FEATURE_SETS,
  NAME_FEATURE_SETS,
  PHONE_FEATURE_SETS,
  SUMMARY_FEATURE_SETS,
  URL_FEATURE_SETS,
} from './featureSets'
import {
  entryParts,
  isoDate,
  splitLanguageLine,
  splitSkillLine,
  splitTitleParts,
  urlIn,
  YEAR_RE,
} from './entryFields'
import { BULLET_RE } from './bulletPoints'
import { normalize, isCvLabel } from './sectionKeywords'

// L'en-tête tient sur quelques lignes. Au-delà, une ligne est du contenu, et le
// scoring de localisation finirait par y trouver une « ville ».
const HEADER_MAX_LINES = 12

const LINKEDIN_HOSTS = ['linkedin.com', 'linkedin.cn']
const GITHUB_HOSTS = ['github.com']

const stripBullet = (line) => line.replace(BULLET_RE, '').trim()

function routeUrl(url) {
  let host = ''
  try {
    host = new URL(url).hostname
  } catch {
    return 'website'
  }
  if (LINKEDIN_HOSTS.some((candidate) => host.includes(candidate))) return 'linkedin'
  if (GITHUB_HOSTS.some((candidate) => host.includes(candidate))) return 'github'
  return 'website'
}

/**
 * Extrait l'en-tête : chaque champ part en compétition avec les autres.
 * Un candidat qui ressemble à un nom mais contient un « @ » est écarté par une
 * pénalité, ce qui règle le cas des contacts inversés entre eux.
 */
export function extractProfileHeader(lines) {
  const items = lines.slice(0, HEADER_MAX_LINES).flatMap((line) => line)
  const [fullName] = getTextWithHighestFeatureScore(items, NAME_FEATURE_SETS)
  const [email] = getTextWithHighestFeatureScore(items, EMAIL_FEATURE_SETS)
  const [phone] = getTextWithHighestFeatureScore(items, PHONE_FEATURE_SETS)
  const [city] = getTextWithHighestFeatureScore(items, LOCATION_FEATURE_SETS)
  const [country] = getTextWithHighestFeatureScore(items, COUNTRY_FEATURE_SETS)
  // Un CV porte souvent plusieurs liens (portfolio, GitHub, LinkedIn) : ne garder
  // que le meilleur candidat perd les autres. On les collecte tous, puis on garde
  // les liens réellement distincts.
  const urls = []
  const seenUrls = new Set()
  for (const item of items) {
    const value = getTextWithHighestFeatureScore([item], URL_FEATURE_SETS)[0]
    const url = value && typeof value === 'string' ? value.trim() : ''
    if (!url || seenUrls.has(url)) continue
    seenUrls.add(url)
    urls.push(url)
  }

  const header = {}
  if (fullName) header.full_name = fullName
  if (email) header.email = email
  // Un numéro qui ne contient que 5 chiffres n'est pas un téléphone.
  if (phone && phone.replace(/\D/g, '').length >= 9) header.phone = phone.trim()
  if (city) header.city = city
  if (country) header.country = country
  const seen = new Set()
  for (const url of urls) {
    const field = routeUrl(url)
    if (header[field] || seen.has(url)) continue
    seen.add(url)
    header[field] = url
  }
  return header
}

/**
 * Titre de poste : la meilleure ligne du bloc qui n'est ni date, ni puce, ni
 * localisation, et qui ressemble à un intitulé.
 *
 * Le nom du candidat est le premier faux positif : les CV en capitales le
 * placent souvent juste avant l'intitulé, et les deux sont en gras.
 */
function extractJobTitle(lines, fullName) {
  const name = (fullName || '').trim().toLowerCase()
  const items = lines.slice(0, 6).flatMap((line) => line)
  const candidates = items.filter((item) => {
    const value = item.text.trim()
    if (!value || value.length > 60) return false
    if (/\d/.test(value)) return false
    if (/[:,|@/]/.test(value)) return false
    if (name && value.toLowerCase() === name) return false
    // `CONTACT`, `LANGUES` : des étiquettes de rubricage, pas un poste.
    if (isCvLabel(value)) return false
    // Un avatar ou un badge d'initiales tient en deux ou trois lettres : jamais
    // un intitulé de poste.
    if (value.replace(/[^A-Za-zÀ-ÿ]/g, '').length <= 3) return false
    return value.split(/\s+/).length <= 5
  })
  if (!candidates.length) return ''
  const isAllUpperCase = (item) => {
    const value = item.text.trim()
    return /[a-zA-ZÀ-ÿ]/.test(value) && value === value.toUpperCase()
  }
  // `CONTACT`, `CV`, `PROFIL` : des étiquettes en capitales, pas des intitulés.
  const isShortLabel = (item) =>
    isAllUpperCase(item) && item.text.trim().split(/\s+/).length <= 1 && item.text.trim().length <= 8
  const [title] = getTextWithHighestFeatureScore(
    candidates,
    [
      [(item) => /^[A-ZÀ-Þ]/.test(item.text.trim()), 1],
      [(item) => !!item.isBold, 2],
      // Un nom en capitales est bien plus fréquent qu'un intitulé en capitales.
      [isAllUpperCase, -2],
      [isShortLabel, -1],
    ],
    false,
  )
  return title || ''
}

/** Résumé : une section dédiée l'emporte toujours sur le texte d'en-tête. */
function extractSummary(profileLines, summaryLines) {
  const dedicated = summaryLines.map(lineText).filter(Boolean).join(' ').trim()
  if (dedicated) return dedicated

  // En l'absence de section, on écarte les lignes déjà reconnues comme en-tête.
  const items = profileLines.slice(HEADER_MAX_LINES).flatMap((line) => line)
  if (!items.length) return ''
  const [summary] = getTextWithHighestFeatureScore(items, SUMMARY_FEATURE_SETS, false, true)
  return summary.replace(/\s+/g, ' ').trim()
}

function subsectionLines(subsection) {
  return subsection.map(lineText).map(stripBullet).filter(Boolean)
}

function buildExperiences(subsection) {
  const lines = subsectionLines(subsection)
  if (!lines.length) return null
  const [dateText] = getTextWithHighestFeatureScore(
    subsection.flat(),
    DATE_FEATURE_SETS,
  )
  const head = lines[0]
  // La période a pu être recollée sur l'intitulé : inutile, et nuisible, de la
  // recopier une seconde fois.
  const alreadyCarried = !!dateText && lines.some((line) => line.includes(dateText))
  const withDate = dateText && !alreadyCarried ? `${head} ${dateText}` : head
  const parsed = entryParts(withDate, lines.slice(1))
  return {
    position: parsed.position,
    company: parsed.company,
    location: parsed.location,
    date_range: parsed.date_range,
    description: parsed.description,
  }
}

// « Institut Polytechnique de Dakar », «Université Paris-Saclay » : l'établissement
// porte souvent le nom, le diplôme vient ensuite. Reconnaître cet en-tête évite
// d'inverser les deux dans le formulaire.
const INSTITUTION_RE =
  /^(universit|institut|ecole|école|lycee|lycée|college|collège|academie|académie|faculte|faculté|ecole|hochschule|universidad|university|college|school|conservatoire|instituto|escuela|ensam|isara)\b/i

function buildEducation(subsection) {
  const lines = subsectionLines(subsection)
  if (!lines.length) return null
  const raw = lines.join(' ').replace(YEAR_RE, ' ').replace(/[()[\]]/g, ' ')
  const { title, rest } = splitTitleParts(raw)
  if (!title) return null

  // Le diplôme est annoncé avant l'établissement : on remet les deux dans l'ordre.
  const [first, ...following] = lines
  const startsWithInstitution = INSTITUTION_RE.test(first.trim())
  return {
    degree: startsWithInstitution ? following.join(' ').trim() || title : title,
    institution: startsWithInstitution
      ? first.replace(YEAR_RE, '').replace(/(?:^|\s)[–—-]\s*$/, '').trim()
      : (rest[0] || '').replace(YEAR_RE, '').trim(),
    field_of_study: '',
    date_range: lines.join(' ').match(YEAR_RE)?.join(' - ') || '',
  }
}

function buildCertification(subsection) {
  const lines = subsectionLines(subsection)
  if (!lines.length) return null
  const raw = lines.join(' ')
  const { title, rest } = splitTitleParts(raw.replace(YEAR_RE, ' '))
  if (!title) return null
  return { name: title, issuer: rest[0] || '', date: isoDate(raw), url: urlIn(raw) }
}

function buildProject(subsection) {
  const lines = subsectionLines(subsection)
  if (!lines.length) return null
  const raw = lines.join(' ')
  const { title, rest } = splitTitleParts(raw.replace(YEAR_RE, ' '))
  if (!title) return null
  return {
    name: title,
    technologies: rest[0] || '',
    url: urlIn(raw),
    description: lines.slice(1).join(' '),
  }
}

const ENTRY_BUILDERS = {
  experiences: buildExperiences,
  educations: buildEducation,
  certifications: buildCertification,
  projects: buildProject,
}

/**
 * Compétences : `Django, DRF, API REST` describes three skills, not one line.
 *
 * `Backend :` is a rubric and not a skill: it labels the lines that follow it.
 * The editor's skill only holds a name and a level, so the rubric is dropped and
 * each skill of the list is emitted on its own.
 */
function buildSkills(lines) {
  return lines
    .map((line) => stripBullet(lineText(line)).trim())
    .filter(Boolean)
    .flatMap((line) => (line.endsWith(':') ? [] : line.split(/\s*[;|·]\s*|\s*,\s*/)))
    .map((value) => value.trim())
    .filter((value) => value && !value.endsWith(':'))
    .map((value) => splitSkillLine(value))
    .filter((skill) => skill.name)
}

/**
 * Langues : a wrapped line leaves an unclosed parenthesis, as in
 * `Anglais (Lecture technique /` followed by `documentation)`.
 */
function joinWrappedLanguages(lines) {
  const joined = []
  const isUnbalanced = (value) => (value.match(/\(/g) || []).length > (value.match(/\)/g) || []).length

  for (const line of lines) {
    const value = stripBullet(lineText(line)).trim()
    if (!value) continue
    // Only a line already left open continues on the next one.
    if (joined.length && isUnbalanced(joined[joined.length - 1])) joined[joined.length - 1] += ` ${value}`
    else joined.push(value)
  }
  return joined
}

function buildLanguages(lines) {
  return joinWrappedLanguages(lines)
    .map((line) => splitLanguageLine(line))
    .filter((language) => language.name)
}

// Les sections que l'éditeur sait rendre. Une rubrique reconnue mais absente de
// l'éditeur sert uniquement à clore la précédente.
const SUPPORTED_SECTIONS = new Set([
  'experiences',
  'educations',
  'skills',
  'languages',
  'certifications',
  'projects',
  'interests',
])

function buildSectionLines(sectionKey, lines) {
  if (sectionKey === 'skills') return buildSkills(lines)
  if (sectionKey === 'languages') return buildLanguages(lines)
  if (sectionKey === 'interests') {
    return lines
      .map((line) => stripBullet(lineText(line)))
      .flatMap((line) => line.split(/\s*[;·|]\s*|\s{2,}/))
      .map((value) => value.trim())
      .filter(Boolean)
  }
  const build = ENTRY_BUILDERS[sectionKey]
  if (!build) return []
  return divideSectionIntoSubsections(lines).map(build).filter(Boolean)
}

/**
 * Étape 5 : transforme les items d'un PDF en contenu de CV exploitable.
 *
 * @returns {{header: object, summary: string, sections: object, detectedTitles: number}}
 */
export function parseCvItems(items, lang = 'fr') {
  const lines = groupItemsIntoLines(items)
  const groups = groupLinesIntoSections(lines, lang)
  const detectedTitles = groups.filter((group) => group.section).length

  const profileGroup = groups.find((group) => group.title === PROFILE_SECTION)
  const profileLines = profileGroup ? profileGroup.lines : []
  const summaryGroup = groups.find((group) => group.section === 'summary')

  const header = extractProfileHeader(profileLines)
  if (!header.title) {
    const title = extractJobTitle(profileLines, header.full_name)
    if (title) header.title = title
  }

  const sections = {}
  for (const group of groups) {
    if (!group.section || group.section === 'summary') continue
    if (sections[group.section]) continue
    // Une rubrique reconnue mais absente de l'éditeur (`RÉFÉRENCE`) doit tout
    // de même clore la section précédente, sans rien produire.
    if (!SUPPORTED_SECTIONS.has(group.section)) continue
    sections[group.section] = buildSectionLines(group.section, group.lines)
  }

  return {
    header,
    summary: extractSummary(profileLines, summaryGroup ? summaryGroup.lines : []),
    sections,
    detectedTitles,
  }
}

/** Texte brut d'un PDF, pour le repli sur le parseur textuel. */
export function itemsToText(lines) {
  return lines.map(lineText).filter(Boolean).join('\n')
}

export { groupItemsIntoLines, lineText, normalize }
