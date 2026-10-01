import { BULLET_POINTS } from './bulletPoints'

/**
 * Étape 2 : regroupe les items en lignes.
 *
 * Un PDF issu d'un logiciel de PAO découpe souvent un même mot en dizaines
 * d'items distincts. Sans fusion, une ligne devient une simple succession de
 * mots et plus aucun titre n'est reconnaissable.
 *
 * L'ordre du flux de pdf.js n'est pas un ordre de lecture. Sur un CV à deux
 * colonnes, il entremêle la colonne de gauche et celle de droite : le titre
 * « COMPÉTENCES » arrive avant son contenu, qui se retrouve collé au corps du
 * CV. On réordonne donc par colonne, puis du haut vers le bas.
 */

// Une gouttière doit être assez large pour séparer deux colonnes de texte.
const GUTTER_MIN_RATIO = 0.05
const GUTTER_MIN_WIDTH = 24
// Au-delà, un texte est réparti sur au moins 10 % de la page de chaque côté.
const COLUMN_MIN_RATIO = 0.1
// Une colonne est une suite verticale de lignes. En dessous, on ne découpe plus
// des colonnes mais un simple espace entre deux mots posés sur une même ligne.
const COLUMN_MIN_LINES = 3
// Chaque colonne couvre une bonne part de la hauteur de la page. Une colonne qui
// ne tiendrait que le tiers des lignes est un fragment de paragraphe justifié,
// pas une colonne.
const COLUMN_MIN_BASELINE_RATIO = 0.4
// Une gouttière peut être franchie par un titre à cheval sur les deux colonnes.
// Si une part notable du texte la traverse, c'est une ligne unique et non une
// séparation.
const CROSSING_MAX_RATIO = 0.15
// Un texte lettré à l Tracking (D É V E LO PP E U R) se reconnaît à ses mots
// d'une seule lettre.
const TRACKED_MIN_TOKENS = 4
const TRACKED_RATIO = 0.7

/** Largeur moyenne d'un caractère, mesurée sur la police et la taille dominantes. */
export function getTypicalCharWidth(items) {
  const filled = items.filter((item) => item.text.trim())
  if (!filled.length) return 0

  // La taille dominante, en nombre d'items.
  const heightCounts = new Map()
  let commonHeight = 0
  let heightMax = 0
  // La police dominante, en nombre de caractères : un item de titre ne compte
  // pas autant qu'un paragraphe.
  const fontCounts = new Map()
  let commonFont = ''
  let fontMax = 0

  for (const item of filled) {
    heightCounts.set(item.height, (heightCounts.get(item.height) || 0) + 1)
    if (heightCounts.get(item.height) > heightMax) {
      commonHeight = item.height
      heightMax = heightCounts.get(item.height)
    }
    fontCounts.set(item.fontName, (fontCounts.get(item.fontName) || 0) + item.text.length)
    if (fontCounts.get(item.fontName) > fontMax) {
      commonFont = item.fontName
      fontMax = fontCounts.get(item.fontName)
    }
  }

  const common = filled.filter((item) => item.fontName === commonFont && item.height === commonHeight)
  const totalWidth = common.reduce((sum, item) => sum + item.width, 0)
  const totalChars = common.reduce((sum, item) => sum + item.text.length, 0)
  return totalChars ? totalWidth / totalChars : 0
}

// Ponctuation qui se colle au mot de gauche : `Contact` + `:` = `Contact:`.
const ATTACHED_LEFT = [':', ',', '.', ';', '!', '?', ')', ']', '»', '%']

/** La fusion avale les espaces : on les restitue quand la ponctuation les impose. */
export function shouldAddSpaceBetweenText(left, right) {
  const leftEnd = left[left.length - 1]
  const rightStart = right[0]
  return (
    ([':', ',', '|', '.', ...BULLET_POINTS].includes(leftEnd) && rightStart !== ' ') ||
    (leftEnd !== ' ' && ['|', ...BULLET_POINTS].includes(rightStart))
  )
}

const charCount = (items) => items.reduce((sum, item) => sum + item.text.trim().length, 0)

/** Une ligne de base est identifiée par son y arrondi. */
const baselineKey = (item) => Math.round(item.y)

/** Nombre de lignes de base distinctes que porte un ensemble d'items. */
function countBaselines(items) {
  return new Set(items.map(baselineKey)).size
}
/** Bande verticale vide assez large pour séparer deux colonnes. */
function findGutter(items) {
  const left = Math.min(...items.map((item) => item.x))
  const right = Math.max(...items.map((item) => item.x + item.width))
  const width = right - left
  if (width <= 0) return null

  // Une colonne se repère sur les x de *départ* des lignes. Un titre qui s'étale
  // sur toute la largeur recouvrirait sinon la gouttière et la ferait disparaître.
  const size = Math.ceil(width) + 1
  const covered = new Uint8Array(size)
  for (const item of items) {
    if (!item.text.trim()) continue
    covered[Math.max(0, Math.min(size - 1, Math.floor(item.x - left)))] = 1
  }

  const minGutter = Math.max(GUTTER_MIN_WIDTH, width * GUTTER_MIN_RATIO)
  const total = charCount(items)
  const baselines = new Set(items.filter((i) => i.text.trim()).map(baselineKey))
  let best = null
  let run = -1

  for (let bin = 0; bin <= size; bin += 1) {
    const empty = bin < size && covered[bin] === 0
    if (empty) {
      if (run < 0) run = bin
      continue
    }
    if (run < 0) continue

    const from = left + run
    const to = left + bin
    run = -1
    if (to - from < minGutter) continue

    // Une gouttière ne vaut que si les deux côtés portent vraiment du texte,
    // réparti sur plusieurs lignes : sinon ce n'est qu'un mot plus loin.
    const leftItems = items.filter((item) => item.x < from)
    const rightItems = items.filter((item) => item.x >= to)
    if (charCount(leftItems) < total * COLUMN_MIN_RATIO) continue
    if (charCount(rightItems) < total * COLUMN_MIN_RATIO) continue
    if (countBaselines(leftItems) < COLUMN_MIN_LINES) continue
    if (countBaselines(rightItems) < COLUMN_MIN_LINES) continue

    // Une vraie colonne s'étale sur la hauteur de la page, comme sa voisine.
    if (countBaselines(leftItems) < baselines.size * COLUMN_MIN_BASELINE_RATIO) continue
    if (countBaselines(rightItems) < baselines.size * COLUMN_MIN_BASELINE_RATIO) continue

    const crossing = charCount(items.filter((item) => item.x < to && item.x + item.width > from))
    if (crossing > total * CROSSING_MAX_RATIO) continue

    if (!best || to - from > best.to - best.from) best = { from, to }
  }

  return best
}

/**
 * Répartit les items en colonnes.
 *
 * Le nom et le titre du candidat s'étalent souvent sur les deux colonnes : ils
 * forment l'en-tête, qui se lit avant le reste. Vient ensuite la colonne de
 * gauche, puis celle de droite.
 */
function splitIntoColumns(items) {
  const gutter = findGutter(items)
  if (!gutter) return [items]

  const spanning = []
  const left = []
  const right = []
  for (const item of items) {
    if (!item.text.trim()) continue
    // Couvre toute la gouttière : c'est l'en-tête du CV, pas une colonne.
    if (item.x <= gutter.from && item.x + item.width >= gutter.to) spanning.push(item)
    else (item.x < gutter.to ? left : right).push(item)
  }
  return [spanning, left, right].filter((column) => column.length)
}

/** De haut en bas, puis de gauche à droite : l'ordre de lecture d'une colonne. */
function sortForReading(items) {
  return [...items].sort((a, b) => (a.y === b.y ? a.x - b.x : b.y - a.y))
}

function groupByBaseline(items) {
  const lines = []
  let current = []
  let lastY = null
  for (const item of sortForReading(items)) {
    if (lastY !== null && Math.abs(item.y - lastY) > 2) {
      lines.push(current)
      current = []
    }
    current.push({ ...item })
    lastY = item.y
  }
  if (current.length) lines.push(current)

  // Dans une même ligne, seul le x compte : une date posée 0,4 pt plus haut que
  // l'intitulé ne doit pas passer devant lui.
  return lines.map((line) => line.sort((a, b) => a.x - b.x))
}

/**
 * Un texte en CAPITALES espacées lettre par lettre n'est pas un titre lisible :
 * `D É V E LO P P E U R` doit redevenir `DÉVELOPPEUR`.
 */
export function collapseLetterSpacing(text) {
  const tokens = text.split(/\s+/).filter(Boolean)
  if (tokens.length < TRACKED_MIN_TOKENS) return text
  const singles = tokens.filter((token) => token.length === 1).length
  if (singles / tokens.length < TRACKED_RATIO) return text

  // Les espaces ne sautent qu'entre deux vrais mots : `D É V E LO P P E U R`
  // devient `DÉVELOPPEUR` mais `P P E U R F U L L` garde son blanc.
  return tokens.reduce((out, token, index) => {
    if (index === 0) return token
    const previous = tokens[index - 1]
    return `${out}${previous.length > 1 && token.length > 1 ? ' ' : ''}${token}`
  }, '')
}

const WORDY_END = /[\p{L}\p{N}]$/u
const WORDY_START = /^[\p{L}\p{N}]/u

function mergeAdjacentItems(lines, typicalCharWidth) {
  for (const line of lines) {
    // Parcours depuis la fin : la suppression d'un item ne décale pas l'index.
    for (let i = line.length - 1; i > 0; i -= 1) {
      const current = line[i]
      const left = line[i - 1]
      const distance = current.x - (left.x + left.width)
      // PDF.js ne coupe jamais un mot sans trait d'union, donc deux fragments
      // alphanumériques qui se font face sont deux mots distincts. L'écart peut
      // être nul ou plus petit qu'un espace : `B2C` + `Août 2024` arrive avec
      // 0,7 pt et une date alignée à droite.
      const touching = distance <= typicalCharWidth * 0.6
      const needsSpace =
        !left.text.endsWith(' ') &&
        !current.text.startsWith(' ') &&
        !ATTACHED_LEFT.includes(current.text[0]) &&
        (touching
          ? // Deux fragments alphanumériques face à face : `B2C` puis `Août`. La
            // ponctuation garde la priorité, sinon `Contact:` + `jean` perd son blanc.
            (WORDY_END.test(left.text) && WORDY_START.test(current.text)) ||
            shouldAddSpaceBetweenText(left.text, current.text)
          : distance > typicalCharWidth * 0.25 || shouldAddSpaceBetweenText(left.text, current.text))

      if (needsSpace) left.text += ' '
      left.text += current.text
      left.width = Math.max(left.x + left.width, current.x + current.width) - left.x
      left.hasEOL = left.hasEOL || current.hasEOL
      line.splice(i, 1)
    }
    if (line.length === 1) line[0].text = collapseLetterSpacing(line[0].text)
  }
  return lines
}

export function groupItemsIntoLines(items) {
  const byPage = new Map()
  for (const item of items) {
    const key = item.page ?? 0
    if (!byPage.has(key)) byPage.set(key, [])
    byPage.get(key).push(item)
  }

  const lines = []
  for (const pageItems of byPage.values()) {
    const typicalCharWidth = getTypicalCharWidth(pageItems)
    for (const column of splitIntoColumns(pageItems)) {
      lines.push(...mergeAdjacentItems(groupByBaseline(column), typicalCharWidth))
    }
  }

  return lines
}
