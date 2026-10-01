import mammoth from 'mammoth/mammoth.browser'

import {
  detectHeading,
  normalize,
  SECTION_KEYS,
} from './pdf/sectionKeywords'
import {
  entryParts,
  isoDate,
  splitLanguageLine,
  splitSkillLine,
  splitTitleParts,
  urlIn,
  YEAR_RE,
} from './pdf/entryFields'
import { BULLET_RE } from './pdf/bulletPoints'
import { readPdfItems } from './pdf/pdfItems'
import { groupItemsIntoLines } from './pdf/lines'
import { parseCvItems } from './pdf/parseCvItems'

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
const PHONE_RE = /(?:\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,4}(?:[\s.-]?\d{2,4})?/

const LINKEDIN_HOSTS = ['linkedin.com', 'linkedin.cn']
const GITHUB_HOSTS = ['github.com']

export const CONTACT_FIELDS = ['email', 'phone', 'city', 'country', 'address', 'linkedin', 'github', 'portfolio', 'website', 'full_name', 'title']

function isNoiseLine(line) {
  const n = normalize(line)
  return !n || n.startsWith('curriculum vitae') || n === 'cv' || n === 'cv.fr' || /^[\W_]+$/.test(n)
}

// Filet de sécurité : une phrase longue ou terminée par un point n'appartient pas
// à une section. Sans cette sortie, un seul faux titre capturerait tout le CV.
function looksLikeProse(line) {
  const words = line.split(/\s+/).filter(Boolean)
  return words.length > 12 || line.length > 220 || /[.!?…]$/.test(line)
}

// L'en-tête n'est lu que sur les premières lignes libres du CV : plus loin, une
// ligne est du contenu et non une coordonnée.
const HEADER_MAX_LINES = 8

// Mots qui trahissent une intitulé de poste : sans eux, « Développeuse Python »
// ressemblerait à un nom de personne.
const ROLE_RE =
  /\b(developpe|developpe|ingenieur|engineer|chef|consultant|designer|analyst|manager|commercial|technicien|architecte|associe|charge|responsable|directeur|stage|apprenti|freelance|assistant|auditeur|pharmacien|comptable|avocat|medecin|professeur|enseignant|agent|cadre|expert|formateur|developpeur)\w*/i

function isLikelyName(line) {
  if (line.length > 45 || ROLE_RE.test(line)) return false
  const words = line.split(/\s+/).filter(Boolean)
  if (words.length < 2 || words.length > 4) return false
  return words.every((word) => /^[A-ZÀ-Ý][A-Za-zÀ-ÿ'.-]*$/.test(word))
}

function isLikelyTitle(line) {
  if (line.length > 60 || /\d/.test(line) || /[:,|@/]/.test(line)) return false
  const words = line.split(/\s+/).filter(Boolean)
  if (!words.length || words.length > 5) return false
  // Un poste est capitalisé et reste court : sinon c'est une phrase.
  return words.some((word) => /^[A-ZÀ-Ý][a-zà-ÿ]{2,}$/.test(word))
}

// Ville/pays uniquement s'ils constituent la ligne entière, ou sa fin sur une
// ligne de contact. Le motif était appliqué à toute ligne du CV : n'importe quel
// « entreprise, ville » devenait une localisation.
function matchCityCountry(line) {
  const whole = line.match(/^([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' -]{1,30})\s*[,;]\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' -]{1,30})$/)
  if (whole) return { city: whole[1].trim(), country: whole[2].trim() }
  if (!/@|\d{4}/.test(line)) return null
  const tail = line.match(/[,;|]\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' -]{1,30})\s*,\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' -]{1,30})\s*$/)
  if (tail) return { city: tail[1].trim(), country: tail[2].trim() }
  return null
}

function readHeader(header, line) {
  let consumed = false
  const email = line.match(EMAIL_RE)
  if (email && !header.email) {
    header.email = email[0]
    consumed = true
  }
  const urlMatch = line.match(/https?:\/\/[^\s|]+/i) || line.match(/(^|[\s|,(])www\.[\w-]+\.[a-z]{2,}[^\s|),]*/i)
  if (urlMatch) {
    // Beaucoup de CV écrivent « www.site.com » sans schéma : on le rend cliquable.
    const rawUrl = urlMatch[0].replace(/^[\s|,(]/, '').replace(/[.,;)]+$/, '')
    const url = /^www\./i.test(rawUrl) ? `https://${rawUrl}` : rawUrl
    let host = ''
    try {
      host = new URL(url).hostname
    } catch {
      host = ''
    }
    if (LINKEDIN_HOSTS.some((h) => host.includes(h))) {
      if (!header.linkedin) consumed = true
      header.linkedin = url
    } else if (GITHUB_HOSTS.some((h) => host.includes(h))) {
      if (!header.github) consumed = true
      header.github = url
    } else {
      if (!header.website) consumed = true
      header.website = url
    }
  }
  const phone = line.match(PHONE_RE)
  // Le test porte sur les chiffres seuls : « 06 12 34 56 78 » est un numéro
  // valide mais ne contient aucune suite de 6 chiffres consécutifs.
  if (phone && !header.phone && /\d{6,}/.test(phone[0].replace(/\D/g, ''))) {
    header.phone = phone[0].trim()
    consumed = true
  }

  if (!header.full_name && isLikelyName(line)) {
    header.full_name = line
    return true
  }
  const place = matchCityCountry(line)
  if (place && !header.city) {
    header.city = place.city
    header.country = place.country
    return true
  }
  if (!header.title && isLikelyTitle(line)) {
    header.title = line
    return true
  }
  return consumed
}

// Découpe une section d'entrées : une ligne contenant une année en ouvre une
// nouvelle, les suivantes la complètent (description).
function splitEntries(lines) {
  return groupEntryLines(lines).map((group) => ({
    ...entryParts(group[0], group.slice(1)),
    lines: group,
  }))
}

// Regroupe les lignes en entrées. Deux signaux : une puce (un item par ligne) ou
// une année (nouvelle entrée). Sans l'un des deux, la ligne est une suite.
function groupEntryLines(lines) {
  const stripped = lines.map((line) => line.replace(BULLET_RE, '').trim())
  const bulleted = stripped.some((line, index) => line !== lines[index])
  const groups = []
  for (const line of stripped) {
    if (!line) continue
    if (bulleted || !groups.length || YEAR_RE.test(line)) groups.push([line])
    else groups[groups.length - 1].push(line)
  }
  return groups
}

export function parseCvText(rawText, lang = 'fr') {
  const header = {}
  const summaryParts = []
  // `summary` doit exister : `detectHeading` le renvoie pour « Profil », « Résumé »,
  // « Présentation »… Sans cette clé, tout CV qui a une section Profil plante ici.
  const blocks = { summary: [], experiences: [], educations: [], skills: [], languages: [], certifications: [], projects: [], interests: [] }
  let active = null
  let headerLines = 0

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

  for (const line of lines) {
    if (isNoiseLine(line)) continue

    const heading = detectHeading(line, lang)
    if (heading) {
      active = heading
      continue
    }

    // Filet de sécurité : une phrase longue clôt la section courante. Sans cela,
    // un titre mal reconnu aspirait tout le reste du CV vers cette section.
    if (active && blocks[active].length >= 2 && looksLikeProse(line)) active = null

    if (active) {
      blocks[active].push(line)
      continue
    }

    if (headerLines < HEADER_MAX_LINES) {
      headerLines += 1
      // Nom, intitulé et localisation ne sont lus qu'ici, sinon une ligne de
      // contenu Lambda (...) était prise pour une ville.
      if (readHeader(header, line)) continue
    }

    summaryParts.push(line)
  }

  const sections = {}
  for (const key of SECTION_KEYS) {
    if (key === 'experiences') {
      sections[key] = splitEntries(blocks[key]).map((e) => ({
        position: e.position,
        company: e.company,
        location: e.location,
        date_range: e.date_range,
        description: e.description,
      }))
    } else if (key === 'educations') {
      // Schéma des formations : `degree`/`institution`, pas `position`/`company`.
      // Réutiliser `entryParts` produirait des fiches vides, car aucun template ne
      // lit `position` pour une formation. On repart donc des lignes brutes.
      sections[key] = splitEntries(blocks[key]).map((entry) => {
        const raw = entry.lines.join(' ').replace(YEAR_RE, ' ').replace(/[()[\]]/g, ' ')
        const { title, rest } = splitTitleParts(raw)
        return {
          degree: title,
          institution: rest[0] || '',
          field_of_study: '',
          date_range: entry.date_range,
        }
      })
    } else if (key === 'certifications') {
      sections[key] = splitEntries(blocks[key]).map((entry) => {
        const raw = entry.lines.join(' ')
        const { title, rest } = splitTitleParts(raw.replace(YEAR_RE, ' '))
        return {
          name: title,
          issuer: rest[0] || '',
          date: isoDate(raw),
          url: urlIn(raw),
        }
      })
    } else if (key === 'projects') {
      sections[key] = splitEntries(blocks[key]).map((entry) => {
        const raw = entry.lines.join(' ')
        const { title, rest } = splitTitleParts(raw.replace(YEAR_RE, ' '))
        return {
          name: title,
          technologies: rest[0] || '',
          url: urlIn(raw),
          description: entry.description,
        }
      })
    } else if (key === 'interests') {
      sections[key] = blocks[key].filter(Boolean)
    } else if (key === 'skills') {
      sections[key] = blocks[key].map(splitSkillLine).filter((it) => it.name)
    } else if (key === 'languages') {
      sections[key] = blocks[key].map(splitLanguageLine).filter((it) => it.name)
    }
  }
  // Le résumé est soit dans l'en-tête (avant tout titre de section), soit sous un
  // titre « Profil » / « Résumé » : les deux cas doivent être conservés.
  sections.summary = [summaryParts.join(' '), blocks.summary.join(' ')].filter(Boolean).join(' ').trim()

  return {
    header: Object.fromEntries(Object.entries(header).filter(([, v]) => v)),
    summary: sections.summary,
    sections,
  }
}

// Extrait le texte brut d'un fichier. Le PDF fait exception : il n'a pas de texte
// brut fiable (l'ordre des items est celui du moteur PDF, pas celui de la lecture)
// et passe par `parseCvFile`, qui exploite la géométrie.
export async function extractTextFile(file) {
  const name = (file?.name || '').toLowerCase()
  const ext = name.split('.').pop()
  if (ext === 'docx') return extractDocx(file)
  if (ext === 'pdf') throw new Error('PDF_IMPORT_REQUIRES_GEOMETRY')
  return (await file.text()) || ''
}

async function extractDocx(file) {
  const arrayBuffer = await file.arrayBuffer()
  const { value } = await mammoth.extractRawText({ arrayBuffer })
  return value || ''
}

// Deux items d'une même ligne partagent la même ligne de base. En unités PDF
// (viewport à l'échelle 1), 2 de marge suffit à regrouper une ligne sans fusionner
// deux lignes consécutives.
const LINE_EPSILON = 2

// Reconstruit les lignes d'une page à partir de la ligne de base de chaque item.
// Sert de repli à `groupItemsIntoLines` lorsque le PDF ne renseigne pas `hasEOL` :
// s'en remettre à lui seul produisait un document d'un seul tenant, que la
// détection des titres rejetait ensuite.
export function buildPageLines(items, baselineOf) {
  const lines = []
  let current = ''
  let lastY = null
  for (const item of items) {
    const str = item.str || ''
    if (!str.trim()) {
      // pdf.js émet un item par espace : ne rien changer à la ligne de base, sinon
      // le texte d'une même ligne se retrouve découpé en morceaux.
      if (item.hasEOL) {
        if (current.trim()) lines.push(current.trim())
        current = ''
        lastY = null
      }
      continue
    }
    const y = baselineOf(item)
    if (lastY !== null && Math.abs(y - lastY) > LINE_EPSILON) {
      lines.push(current.trim())
      current = ''
    }
    current += str
    lastY = y
    if (item.hasEOL) {
      lines.push(current.trim())
      current = ''
      lastY = null
    }
  }
  if (current.trim()) lines.push(current.trim())
  return lines.filter(Boolean)
}

// ── Chemin PDF : pipeline sur les items ─────────────────────────────────────────
// Le texte seul a perdu la mise en forme. Ce chemin la conserve : gras, position
// verticale et découpage en items servent à reconnaître les titres et à découper
// les entrées, là où `parseCvText` ne dispose que de chaînes.

const PDF_MIN_TITLE_LINES = 3

async function extractPdf(file, lang = 'fr') {
  const { items, numPages } = await readPdfItems(file)

  // Un PDF scanné n'a pas de couche texte : le dire explicitement vaut mieux qu'un
  // CV vide dont l'utilisateur ne comprend pas la cause.
  if (numPages > 1 && items.length < Math.max(10, numPages * 4)) {
    throw new Error(
      "Ce PDF ne contient pas de texte sélectionnable (il est probablement scanné ou composé d'images). Utilisez un PDF exporté depuis Word ou Google Docs.",
    )
  }

  const parsed = parseCvItems(items, lang)

  // Aucun titre reconnu : la mise en forme est restée inaccessible (police non
  // résolue, mise en page exotique). Le parseur textuel fait alors mieux, car il
  // ne dépend que du contenu.
  if (parsed.detectedTitles < PDF_MIN_TITLE_LINES) {
    const lines = groupItemsIntoLines(items).map((line) =>
      line.map((item) => item.text).join(''),
    )
    return { ...parseCvText(lines.join('\n'), lang), fallback: true }
  }

  return {
    header: parsed.header,
    summary: parsed.summary,
    sections: parsed.sections,
  }
}

/**
 * Point d'entrée unique de l'import : choisit le pipeline adapté au format.
 * @returns {Promise<{header: object, summary: string, sections: object}>}
 */
export async function parseCvFile(file, lang = 'fr') {
  if (!file) throw new Error('Aucun fichier sélectionné.')
  const name = (file?.name || '').toLowerCase()
  if (name.endsWith('.pdf')) return extractPdf(file, lang)
  const raw = await extractTextFile(file)
  if (!raw || !raw.trim()) throw new Error('Aucun texte à analyser. Choisissez un fichier CV.')
  return parseCvText(raw, lang)
}

export default { extractTextFile, parseCvText, parseCvFile }
