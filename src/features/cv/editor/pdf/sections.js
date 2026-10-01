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
 *
 * Les générateurs scindent parfois un titre en pleine justified : « EXPÉRIENCES »
 * devient deux items, `EXPE` puis `RIENCES`. On recolle donc les items d'une
 * ligne courte avant de conclure, sans quoi la ligne n'est jamais « seule ».
 */
export function isSectionTitle(line, lang = 'fr') {
  const item = line[0]
  const standalone = isStandaloneLine(line)
  // Recollage des items d'un titre fractionné : uniquement si la ligne est
  // entièrement occupée par des fragments typographiques courts.
  const joined = line.length > 1 && line.length <= 4 ? line.map((i) => i.text).join('') : item?.text
  const text = (joined || '').trim()
  if (!text) return null

  const emphasised =
    line.every((i) => i.isBold === item?.isBold) && (item?.isBold || item?.isItalic) && isAllUpperCase(text)
  const words = cleanHeading(text).split(/\s+/).filter(Boolean)
  // Un titre fractionné garde le compte de mots de sa version reassemblée.
  const maxWords = emphasised ? 4 : 2
  if (words.length > maxWords) return null
  if (!hasOnlyLettersAndSpaces(text)) return null
  if (!hasLetter(text) || !/[A-ZÀ-Þ]/.test(text.slice(0, 1))) return null

  // Une ligne partagée avec du contenu n'est un titre que si tout est typographié
  // de la même façon : sinon « EXPÉRIENCES perturbations clients » passe aussi.
  if (!standalone && line.some((i) => i.isBold !== item?.isBold || i.isItalic !== item?.isItalic)) {
    return null
  }

  const key = detectHeading(text, lang)
  if (key) return key

  // Un titre justifié est réécrit avec un faux blanc : « EXPÉRIENCES » arrive en
  // `EXPE` + `RIENCES`, que la fusion sépare par une espace. On retente sans
  // les blancs, le contrôle de longueur et de casse encadrant déjà le résultat.
  if (/ /.test(text)) return detectHeading(text.replace(/ /g, ''), lang)
  return null
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
