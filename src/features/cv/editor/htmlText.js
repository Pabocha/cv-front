/**
 * Conversion entre le HTML de `RichEditor` et le texte brut de l'IA.
 *
 * L'éditeur stocke de l'`innerHTML` (gras, listes à puces) alors que le
 * fournisseur IA travaille sur du texte : on envoie du texte, on réinjecte du
 * HTML. Les puces sont converties en lignes « - », que le prompt demande
 * explicitement de conserver.
 */

const BULLET_RE = /^\s*[-•*]\s+/
const BLOCK_TAGS = new Set(['P', 'DIV', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'SECTION', 'TR'])

/**
 * Le contenu de l'éditeur est réinjecté en `innerHTML` : tout ce que produit
 * l'IA passe par là, il faut donc échapper avant de reconstruire le HTML.
 */
function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function nodeText(node) {
  if (node.nodeType === 3) return node.nodeValue || ''
  if (node.nodeType !== 1) return ''
  if (node.tagName === 'BR') return '\n'

  const inner = Array.from(node.childNodes).map(nodeText).join('')
  if (node.tagName === 'LI') return `\n- ${inner.trim()}\n`
  if (BLOCK_TAGS.has(node.tagName)) return `\n${inner}\n`
  return inner
}

/** Une ligne par phrase ou par puce, sans espaces superflus ni lignes vides. */
function normalizeLines(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
}

export function htmlToText(html) {
  const source = String(html || '')
  if (!source.trim()) return ''

  const holder = document.createElement('div')
  holder.innerHTML = source
  return normalizeLines(nodeText(holder))
}

export function textToHtml(text) {
  const lines = normalizeLines(text).split('\n').filter(Boolean)
  if (!lines.length) return ''

  // Liste à puces uniquement si toutes les lignes en sont une : sinon on garde
  // un texte simple, reconstruire une liste à moitié serait trompeur.
  if (lines.every((line) => BULLET_RE.test(line))) {
    const items = lines
      .map((line) => `<li>${escapeHtml(line.replace(BULLET_RE, ''))}</li>`)
      .join('')
    return `<ul>${items}</ul>`
  }
  return lines.map(escapeHtml).join('<br>')
}
