import mammoth from 'mammoth/mammoth.browser'
import * as pdfjsLib from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

const normalize = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const KEYWORDS = {
  fr: {
    summary: ['profil', 'resume', 'a propos', 'presentation'],
    experiences: ['experience', 'parcours professionnel', 'emploi'],
    educations: ['formation', 'education', 'diplome', 'universite'],
    skills: ['competence', 'savoir-faire', 'aptitude'],
    languages: ['langue'],
    certifications: ['certification', 'certificat', 'attestation'],
    projects: ['projet', 'portfolio'],
    interests: ['centre', 'loisir', 'interet', 'hobby'],
  },
  en: {
    summary: ['profile', 'summary', 'about me'],
    experiences: ['experience', 'work history', 'employment'],
    educations: ['education', 'degree', 'academic'],
    skills: ['skill'],
    languages: ['language'],
    certifications: ['certification', 'certificate'],
    projects: ['project', 'portfolio'],
    interests: ['interest', 'hobbies', 'hobby'],
  },
}

const SECTION_KEYS = Object.keys(KEYWORDS.fr)

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
const PHONE_RE = /(?:\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,4}(?:[\s.-]?\d{2,4})?/
const YEAR_RE = /\b(19\d{2}|20\d{2})\b/gi
const RANGE_SPLIT_RE = /\s*[–—-]\s*/

const LINKEDIN_HOSTS = ['linkedin.com', 'linkedin.cn']
const GITHUB_HOSTS = ['github.com']

export const CONTACT_FIELDS = ['email', 'phone', 'city', 'country', 'address', 'linkedin', 'github', 'portfolio', 'website', 'full_name', 'title']

const NAME_RE = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'. -]{1,70}$/

function isNoiseLine(line) {
  const n = normalize(line)
  return !n || n.startsWith('curriculum vitae') || n === 'cv' || n === 'cv.fr' || /^[\W_]+$/.test(n)
}

function startsWithWord(n, word) {
  if (!n.startsWith(word)) return false
  const after = n[word.length] || ''
  return after === '' || 'sx'.includes(after) || /[\s,.:;()-]/.test(after)
}

function detectHeading(line, lang) {
  const n = normalize(line)
  if (!n || n.length > 40) return null
  for (const key of SECTION_KEYS) {
    const words = KEYWORDS[lang][key] || []
    for (const word of words) {
      if (startsWithWord(n, word)) return key
    }
  }
  return null
}

function entryParts(titleLine, restLines) {
  const onRanges = titleLine.match(YEAR_RE)
  let clean = titleLine.replace(YEAR_RE, ' ').replace(RANGE_SPLIT_RE, ' ').replace(/\s+/g, ' ').trim()
  const locationMatch = clean.match(/,\s*([^,]{2,40})$/i)
  const location = locationMatch ? locationMatch[1].trim() : ''
  if (locationMatch) clean = clean.replace(locationMatch[0], '').trim()
  const sep = clean.includes('|') ? '|' : clean.includes('—') ? '—' : null
  let position = ''
  let company = ''
  if (sep) {
    const [p, c] = clean.split(sep)
    position = (p || '').trim()
    company = (c || '').trim()
  } else if (/chez\s/i.test(clean)) {
    const idx = normalize(clean).lastIndexOf('chez')
    position = clean.slice(0, idx).trim()
    company = clean.slice(idx + 4).trim()
  } else {
    position = clean
    company = ''
  }
  const description = restLines.join(' ')
  const range = onRanges && onRanges.length > 0 ? onRanges.join(' - ') : ''
  return { position, company, location, date_range: range, description }
}

function splitLevel(item) {
  const parts = item.split(/\s*[:—-]\s*/)
  if (parts.length > 1) return { name: parts[0].trim(), level: parts.slice(1).join(' ').trim() }
  return { name: item.trim(), level: '' }
}

export function parseCvText(rawText, lang = 'fr') {
  const header = {}
  const summaryParts = []
  const blocks = { experiences: [], educations: [], skills: [], languages: [], certifications: [], projects: [], interests: [] }
  let active = null

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

  for (const line of lines) {
    if (isNoiseLine(line)) continue

    const heading = detectHeading(line, lang)
    if (heading) {
      active = heading
      continue
    }

    const email = line.match(EMAIL_RE)
    if (email && !header.email) header.email = email[0]

    const urlMatch = line.match(/https?:\/\/[^\s]+/i)
    if (urlMatch) {
      const url = urlMatch[0].replace(/[.,;)]+$/, '')
      let host = ''
      try {
        host = new URL(url).hostname
      } catch {
        host = ''
      }
      if (LINKEDIN_HOSTS.some((h) => host.includes(h))) header.linkedin = url
      else if (GITHUB_HOSTS.some((h) => host.includes(h))) header.github = url
      else header.website = url
    }

    const phone = line.match(PHONE_RE)
    if (phone && !header.phone && /\d{6,}/.test(phone[0])) header.phone = phone[0].trim()

    if (active) {
      blocks[active].push(line)
      continue
    }

    if (!header.full_name && NAME_RE.test(line)) {
      header.full_name = line
      continue
    }

    const cityCountry = line.match(/\b([A-Za-zÀ-ÿ-]{2,40})\s*,\s*([A-Za-zÀ-ÿ ]{2,40})$/i)
    if (cityCountry && !header.city) {
      header.city = cityCountry[1]
      header.country = cityCountry[2]
      continue
    }

    if (!header.title && /^[A-ZÀ-Ý]/.test(line) && !/\d/.test(line) && !/[:,|]/.test(line) && line.length <= 70) {
      header.title = line
      continue
    }

    summaryParts.push(line)
  }

  const sections = {}
  for (const key of SECTION_KEYS) {
    if (key === 'experiences' || key === 'educations') {
      const entries = []
      let current = null
      for (const line of blocks[key]) {
        if (YEAR_RE.test(line)) {
          if (current) entries.push(current)
          current = entryParts(line, [])
        } else if (current) {
          if (!current.position && !current.company) current.position = line
          else if (current.company && !current.position) current.position = line
          else current.description = [current.description, line].filter(Boolean).join(' ')
        } else {
          current = { position: line, company: '', location: '', date_range: '', description: '' }
        }
      }
      if (current) entries.push(current)
      sections[key] = entries
    } else if (key === 'interests') {
      sections[key] = blocks[key].filter(Boolean)
    } else {
      sections[key] = blocks[key].map(splitLevel).filter((it) => it.name)
    }
  }
  sections.summary = summaryParts.join(' ').trim()

  return {
    header: Object.fromEntries(Object.entries(header).filter(([, v]) => v)),
    summary: sections.summary,
    sections,
  }
}

export async function extractTextFile(file) {
  const name = (file?.name || '').toLowerCase()
  const ext = name.split('.').pop()
  if (ext === 'docx') return extractDocx(file)
  if (ext === 'pdf') return extractPdf(file)
  return (await file.text()) || ''
}

async function extractDocx(file) {
  const arrayBuffer = await file.arrayBuffer()
  const { value } = await mammoth.extractRawText({ arrayBuffer })
  return value || ''
}

async function extractPdf(file) {
  const data = new Uint8Array(await file.arrayBuffer())
  const pdf = await pdfjsLib.getDocument({ data }).promise
  let text = ''
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()
    text += content.items
      .map((item) => (item.str || '') + (item.hasEOL ? '\n' : ' '))
      .join('')
    text += '\n'
  }
  return text || ''
}

export default { extractTextFile, parseCvText }