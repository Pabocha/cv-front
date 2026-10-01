import { BULLET_POINTS, BULLET_RE } from './bulletPoints'
import { lineText } from './sections'

/**
 * Étape 4 : découpe une section en entrées.
 *
 * Une section « Expérience » contient plusieurs postes. Chaque poste commence par
 * un écart vertical plus grand que l'interlignage normal du corps de texte. Seule
 * la statistique de la section permet de fixer ce seuil : un interlignage de 11 pt
 * dans un CV ne vaut pas 11 pt dans un autre.
 *
 * Ce signal disparaît sur les CV à interlignage régulier. Deux replis le couvrent :
 * la période d'une entrée (une seconde année dans le bloc en annonce une
 * nouvelle) et le gras de la ligne d'intitulé.
 */

const YEAR_TEST_RE = /\b(?:19|20)\d{2}\b/

/** La ligne ne porte qu'une période : c'est une période isolée sur sa ligne. */
function isDateOnlyLine(line) {
  const value = lineText(line)
    .replace(BULLET_RE, '')
    .replace(/[|()[\]]/g, ' ')
    .trim()
  return value.length <= 30 && YEAR_TEST_RE.test(value)
}

/** La ligne contient une année, quoi qu'elle contienne d'autre. */
const hasDateRange = (line) => YEAR_TEST_RE.test(lineText(line))

/**
 * Recolle une période isolée sur la ligne d'intitulé qui la précède. Les modèles
 * les plus fréquents la placent sur sa propre ligne ; sans ce recollement, la
 * ligne d'intitulé ne contient ni poste ni dates, et l'entrée est inexploitable.
 */
function mergeLoneDateLines(lines) {
  const merged = []
  for (const line of lines) {
    const previous = merged[merged.length - 1]
    if (previous && isDateOnlyLine(line) && !isDateOnlyLine(previous)) {
      // `lineText` concatène les items sans séparateur : on réinjecte l'espace.
      const [head, ...tail] = line
      merged[merged.length - 1] = [...previous, { ...head, text: ` ${head.text}` }, ...tail]
      continue
    }
    merged.push(line)
  }
  return merged
}

/**
 * Étape 4 : découpe une section en entrées.
 *
 * Une section « Expérience » contient plusieurs postes. Chaque poste commence par
 * un écart vertical plus grand que l'interlignage normal du corps de texte. Seule
 * la statistique de la section permet de fixer ce seuil : un interlignage de 11 pt
 * dans un CV ne vaut pas 11 pt dans un autre.
 */

function baselineOf(line) {
  return line[0]?.y
}

/** Interlignage le plus fréquent dans la section. */
function getCommonLineGap(lines) {
  const counts = new Map()
  let common = 0
  let maxCount = 0
  for (let i = 1; i < lines.length; i += 1) {
    // Un saut de page donne un écart énorme : il ne doit pas fausser la moyenne.
    if (lines[i][0]?.page !== lines[i - 1][0]?.page) continue
    const previous = baselineOf(lines[i - 1])
    const current = baselineOf(lines[i])
    if (previous == null || current == null) continue
    const gap = Math.round(previous - current)
    counts.set(gap, (counts.get(gap) || 0) + 1)
    if (counts.get(gap) > maxCount) {
      common = gap
      maxCount = counts.get(gap)
    }
  }
  return common
}

function createSubsections(lines, isNewSubsection) {
  const subsections = []
  let current = []
  for (let i = 0; i < lines.length; i += 1) {
    if (i > 0 && isNewSubsection(lines[i], lines[i - 1])) {
      subsections.push(current)
      current = []
    }
    current.push(lines[i])
  }
  if (current.length) subsections.push(current)
  return subsections
}

const isNewSubsectionByLineGap = (gapThreshold) => (line, previousLine) => {
  if (line[0]?.page !== previousLine[0]?.page) return true
  const previous = baselineOf(previousLine)
  const current = baselineOf(line)
  if (previous == null || current == null) return false
  return Math.round(previous - current) > gapThreshold
}

/**
 * Une seconde période dans le même bloc annonce l'entrée suivante.
 *
 * L'état est amorcé sur la première ligne : le prédicat n'est évalué qu'à partir
 * de la deuxième, sinon la période d'ouverture ne serait jamais comptée.
 */
const isNewSubsectionByDate = (firstLine) => {
  let seenDate = hasDateRange(firstLine)
  return (line) => {
    if (!hasDateRange(line)) return false
    const boundary = seenDate
    seenDate = true
    return boundary
  }
}

const isNewSubsectionByBold = (line, previousLine) => {
  const text = line[0]?.text?.trim() || ''
  // Une puce est parfois héritée du gras de son glyphe : elle ne démarre rien.
  if (BULLET_POINTS.includes(text)) return false
  return !previousLine[0]?.isBold && !!line[0]?.isBold
}

export function divideSectionIntoSubsections(rawLines) {
  if (rawLines.length < 2) return rawLines.length ? [rawLines] : []

  const lines = mergeLoneDateLines(rawLines)
  let subsections = createSubsections(lines, isNewSubsectionByLineGap(getCommonLineGap(lines) * 1.4))

  // Un seul bloc : l'écart vertical ne discriminait rien. On retente sur les
  // périodes, puis sur le gras, qui marque le début de chaque poste.
  if (subsections.length === 1) {
    const byDate = createSubsections(lines, isNewSubsectionByDate(lines[0]))
    if (byDate.length > 1) subsections = byDate
  }
  if (subsections.length === 1) {
    const byBold = createSubsections(lines, isNewSubsectionByBold)
    if (byBold.length > 1) subsections = byBold
  }

  return subsections
}
