import { LANGUAGE_LEVELS, SKILL_LEVELS } from '../editorConfigs'
import { normalize } from './sectionKeywords'

export const YEAR_RE = /\b(19\d{2}|20\d{2})\b/gi
// Une plage d'années « 2021 – 2024 » part avec son tiret, sinon il traîne. Les
// tirets collés sont intacts : « Université Paris-Saclay » n'est pas une plage.
export const YEAR_RANGE_RE = /\b\d{4}\s*[–—-]\s*\d{4}\b/g
export const LOOSE_DASH_RE = /\s+[–—-]\s+/g
const TITLE_SEP_RE = /\s*[|•]\s*|\s+[–—]\s+/

const KNOWN_SKILL_LEVELS = new Set(SKILL_LEVELS.map((level) => normalize(level)))
const KNOWN_LANGUAGE_LEVELS = new Set(LANGUAGE_LEVELS.map((level) => normalize(level)))

/**
 * Décompose une ligne d'entrée « Poste, Entreprise | Ville | 2021 - 2024 ».
 * Partagée par le chemin PDF et le chemin texte pour que les deux produisent
 * exactement le même schéma.
 */
const PRESENT_RE = /\b(présent|present|en cours|aujourd'hui|aujourdhui|currently|current|now)\b/i

// « Août 2024 – Mars 2025 » ne laisse pas « Août » et « Mars » dans l'intitulé.
// On retire les mois comme les années : ils appartiennent à la période.
const MONTH_TOKEN_RE = new RegExp(
  String.raw`\b(?:janvier|janv|février|fevr|mars|avril|avr|mai|juin|juillet|juil|août|aout|septembre|sept|octobre|octo|novembre|nov|décembre|dece|january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|jun|jul|aug|sep|oct|nov|dec)\b\.?`,
  'gi',
)

export function entryParts(titleLine, restLines = []) {
  // « 2024 – Présent » : l'année seule ne dit pas que la période est ouverte.
  // Le marqueur doit rejoindre la plage avant d'être retiré de l'intitulé.
  const isCurrent = PRESENT_RE.test(titleLine)
  const onRanges = titleLine.match(YEAR_RE)
  let clean = titleLine
    .replace(PRESENT_RE, ' ')
    .replace(YEAR_RANGE_RE, ' ')
    .replace(YEAR_RE, ' ')
    .replace(MONTH_TOKEN_RE, ' ')
    .replace(LOOSE_DASH_RE, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const sep = clean.includes('|') ? '|' : clean.includes('—') ? '—' : null
  // La localisation n'est devinée que si la ligne n'a pas déjà de séparateur
  // explicite : sinon « Poste, Entreprise | Paris » perdait l'entreprise au profit
  // d'une localisation fausse.
  const locationMatch = sep ? null : clean.match(/,\s*([^,]{2,40})$/i)
  let location = locationMatch ? locationMatch[1].trim() : ''
  if (locationMatch) clean = clean.replace(locationMatch[0], '').trim()
  let position = ''
  let company = ''
  if (sep) {
    const [head, second, ...rest] = clean.split(sep).map((part) => part.trim())
    // La virgule du premier segment tranche avant le séparateur :
    // « Poste, Entreprise | Ville » place la ville après la barre, pas l'entreprise.
    const headParts = (head || '').split(/\s*,\s*/).map((part) => part.trim()).filter(Boolean)
    if (headParts.length >= 2) {
      position = headParts[0]
      company = headParts.slice(1).join(', ')
      location = [second, ...rest].filter(Boolean).join(', ')
    } else {
      position = head || ''
      company = second || ''
      location = rest.filter(Boolean).join(', ')
    }
  } else if (/chez\s/i.test(clean)) {
    const idx = normalize(clean).lastIndexOf('chez')
    position = clean.slice(0, idx).trim()
    company = clean.slice(idx + 4).trim()
  } else {
    position = clean
    company = ''
  }
  const description = restLines.join(' ').trim()
  let range = onRanges && onRanges.length > 0 ? onRanges.join(' - ') : ''
  if (isCurrent) range = range ? `${range} - Présent` : 'Présent'
  return { position, company, location, date_range: range, description }
}

/** Découpe « élément | sous-élément » pour les sections non poste/entreprise. */
export function splitTitleParts(line) {
  const clean = line
    .replace(/[()[\]]/g, ' ')
    .replace(YEAR_RANGE_RE, ' ')
    .replace(YEAR_RE, ' ')
    .replace(LOOSE_DASH_RE, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const segments = clean.split(TITLE_SEP_RE).map((s) => s.trim()).filter(Boolean)
  const head = segments[0] || ''
  // Un titre peut lui-même être composé (« Master, Université ») : la virgule
  // prime sur le séparateur, sinon l'établissement se retrouve dans le diplôme.
  const headParts = head.split(/\s*,\s*/).map((p) => p.trim()).filter(Boolean)
  if (headParts.length >= 2) {
    return { title: headParts[0], rest: [...headParts.slice(1), ...segments.slice(1)] }
  }
  if (segments.length >= 2) return { title: head, rest: segments.slice(1) }
  return { title: clean, rest: [] }
}

// Un trait d'union interne au mot ne sépare pas : « multi-tenant » est une seule
// compétence, pas « multi » niveau « tenant ».
const LEVEL_SEPARATOR_RE = /\s*[:—–]\s*|\s+-\s+/

export function splitLevel(item) {
  const parts = item.split(LEVEL_SEPARATOR_RE)
  if (parts.length > 1) return { name: parts[0].trim(), level: parts.slice(1).join(' ').trim() }
  return { name: item.trim(), level: '' }
}

// « Français (Courant) », « Anglais (Technique) » : le niveau est souvent entre
// parenthèses plutôt qu'après un deux-points.
export function splitParenthesisLevel(item) {
  const match = item.match(/^(.*?)\s*\((.+)\)\s*$/)
  if (!match) return null
  const name = match[1].trim()
  const level = match[2].trim()
  if (!name || !level) return null
  return { name, level }
}

// « Anglais, Courant » : le second fragment n'est retenu comme niveau que s'il
// figure dans la liste de l'éditeur. Sans cette garantie, « Python, Django,
// React » serait coupé en « Python » + « Django, React ».
export function splitNamedLevel(item, knownLevels) {
  const commaParts = item
    .split(/\s*,\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
  if (commaParts.length === 2 && knownLevels.has(normalize(commaParts[1]))) {
    return { name: commaParts[0], level: commaParts[1] }
  }
  return splitLevel(item)
}

export function splitSkillLine(item) {
  return splitNamedLevel(item, KNOWN_SKILL_LEVELS)
}

export function splitLanguageLine(item) {
  return splitParenthesisLevel(item) || splitNamedLevel(item, KNOWN_LANGUAGE_LEVELS)
}

// Les champs `date` de l'éditeur sont des `<input type="date">` : une date illisible
// y serait affichée vide. On ne retient donc que les dates réellement exploitables.
export function isoDate(line) {
  const iso = line.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const fr = line.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b/)
  if (fr) {
    const pad = (n) => String(n).padStart(2, '0')
    return `${fr[3]}-${pad(fr[2])}-${pad(fr[1])}`
  }
  return ''
}

export function urlIn(line) {
  const match = line.match(/https?:\/\/[^\s|]+/i) || line.match(/(^|[\s|(])www\.[\w-]+\.[a-z]{2,}[^\s|),]*/i)
  if (!match) return ''
  const raw = match[0].replace(/^[\s|(]/, '').replace(/[.,;)]+$/, '')
  return /^www\./i.test(raw) ? `https://${raw}` : raw
}
