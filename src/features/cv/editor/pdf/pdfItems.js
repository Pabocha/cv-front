import { pdfjsLib } from './pdfClient'

// pdf.js lit un tiret suivi d'un trait insécable comme un mot de deux caractères
// distincts, ce qui casse la détection des plages d'années.
const BROKEN_DASH_RE = /-\u00AD\u2010/g

const isBoldFont = (fontName) => /bold|black|heavy|semibold|demi/i.test(fontName)

// L'italique porte souvent la même information que le gras : les sous-titres de
// projet sont en italique sur un grand nombre de modèles.
const isItalicFont = (fontName) => /italic|oblique/i.test(fontName)

// Résout le nom de police réel (« Arial-BoldMT ») derrière le nom interne que
// pdf.js invente pour les polices embarquées (« g_d8_f1 »). Sans cette résolution,
// la détection du gras — et donc celle des titres de section — est inopérante.
// Le nom brut est tout de même conservé : certaines polices système le
// renseignent correctement, et le repli sur les mots-clés prend le relais sinon.
function resolveFontName(pdfFontName, commonObjs) {
  if (!commonObjs || typeof commonObjs.get !== 'function') return pdfFontName || ''
  try {
    const fontObj = commonObjs.get(pdfFontName)
    return fontObj?.name || pdfFontName || ''
  } catch {
    return pdfFontName || ''
  }
}

function toItem(raw, page, commonObjs) {
  const fontName = resolveFontName(raw.fontName, commonObjs)
  return {
    text: (raw.str || '').replace(BROKEN_DASH_RE, '-'),
    x: raw.transform[4],
    y: raw.transform[5],
    width: raw.width || 0,
    height: raw.height || 0,
    fontName,
    isBold: isBoldFont(fontName),
    isItalic: isItalicFont(fontName),
    hasEOL: !!raw.hasEOL,
    page,
  }
}

/**
 * Étape 1 : lit un PDF et renvoie les items de texte bruts de toutes ses pages.
 *
 * On conserve les métadonnées (`x`, `y`, `width`, `height`, gras) au lieu de
 * réduire chaque ligne à une chaîne : ce sont elles qui permettent de reconnaître
 * un titre de section ou de découper les entrées d'expérience.
 *
 * @returns {Promise<{items: object[], numPages: number}>}
 */
export async function readPdfItems(file) {
  const data = new Uint8Array(await file.arrayBuffer())
  const doc = await pdfjsLib.getDocument({ data }).promise
  const items = []

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum)
    const textContent = await page.getTextContent()

    // Nécessaire avant de lire `page.commonObjs` : sans cela, la table des polices
    // est vide et tous les noms tombent sur « g_d8_f1 ».
    let commonObjs = null
    try {
      await page.getOperatorList()
      commonObjs = page.commonObjs
    } catch {
      commonObjs = null
    }

    for (const raw of textContent.items) {
      // pdf.js émet un item vide pour chaque espace : sans `hasEOL` ils portent
      // l'information du saut de ligne, avec `hasEOL` ils ne sont que du bruit.
      if (!raw.hasEOL && !raw.str?.trim()) continue
      items.push(toItem(raw, pageNum, commonObjs))
    }
  }

  return { items, numPages: doc.numPages }
}
