import { cleanHeading, detectHeading, normalize } from './sectionKeywords'

export const PROFILE_SECTION = 'profile'

// Un titre de section occupe sa ligne entière. C'est le signal le plus fiable,
// bien avant le contenu du texte.
const isStandaloneLine = (line) => line.length === 1

const isAllUpperCase = (text) => /[a-zA-Z]/.test(text) && text === text.toUpperCase()

const hasLetter = (text) => /[a-zA-Z]/.test(text)

// « Paris » ou « EXPÉRIENCE », mais pas « 2020 - 2024 » ni « React, Node ».
const hasOnlyLettersAndSpaces = (text) => /^[A-Za-z\sÀ-ÿ'&-]+$/.test(text)

/**
 * Décide si une ligne est un titre de section.
 *
 * Un titre est un mot-clé de section posé seul sur sa ligne. Le gras et les
 * capitales ne font qu'autoriser un titre plus long — sans cette réserve, une
 * légende en capitales deviendrait une section ; sans ce crédit, un titre en
 * gras mais pas en capitales serait ignoré.
 */
export function isSectionTitle(line, lang = 'fr') {
  if (!isStandaloneLine(line)) return null
  const item = line[0]
  const text = item.text.trim()
  if (!text) return null

  const emphasised = item.isBold && isAllUpperCase(text)
  const words = cleanHeading(text).split(/\s+/).filter(Boolean)
  if (words.length > (emphasised ? 4 : 2)) return null
  if (!hasOnlyLettersAndSpaces(text)) return null
  if (!hasLetter(text) || !/[A-ZÀ-Þ]/.test(text.slice(0, 1))) return null

  return detectHeading(text, lang)
}

/**
 * Étape 3 : regroupe les lignes sous le titre de section qui les précède.
 * Tout ce qui précède le premier titre appartient au profil.
 *
 * @returns {{title: string, section: string|null, lines: object[][]}[]}
 */
export function groupLinesIntoSections(lines, lang = 'fr') {
  const sections = []
  let current = { title: PROFILE_SECTION, section: null, lines: [] }

  for (const line of lines) {
    const key = isSectionTitle(line, lang)
    if (key) {
      // Le bloc d'en-tête n'existe que s'il contient des lignes : inutile de
      // fabriquer un groupe vide quand le CV démarre par un titre.
      if (current.lines.length) sections.push(current)
      current = { title: line[0].text.trim(), section: key, lines: [] }
      continue
    }
    current.lines.push(line)
  }

  // Une section titrée est conservée même vide : « LANGUES » sans contenu doit
  // rester visible dans l'aperçu plutôt que disparaître.
  if (current.lines.length || current.section) sections.push(current)
  return sections
}

/** Texte d'une ligne, items concaténés. */
export const lineText = (line) => line.map((item) => item.text).join('').trim()

/** Texte d'une section, ligne par ligne. */
export const sectionText = (lines) => lines.map(lineText).filter(Boolean).join('\n')

/** Vrai si la ligne ressemble à du contenu plutôt qu'à un titre. */
export const isBodyLine = (line) => normalize(lineText(line)).length > 0
