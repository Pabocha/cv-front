import mammoth from 'mammoth/mammoth.browser'

import { pdfjsLib } from './pdf/pdfClient'

// Une photo de CV fait rarement moins de 96 px de côté : en dessous, on est
// sur un logo, une puce ou une bordure décorative.
const MIN_SIDE = 96

// Au-delà, le serveur refuse (profiles.serializers.MAX_PHOTO_SIZE) : inutile de
// faire l'aller-retour, et l'utilisateur n'y gagnerait rien.
const MAX_BYTES = 5 * 1024 * 1024

const JPEG_QUALITY = 0.9

const canvasToBlob = (canvas, type = 'image/jpeg', quality = JPEG_QUALITY) =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality))

function putPixels(data, width, height, kind) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  let rgba
  if (kind === pdfjsLib.ImageKind.RGB_24BPP) {
    // 3 octets par pixel alors que canvas en attend 4 : l'alpha est opaque.
    rgba = new Uint8ClampedArray(width * height * 4)
    for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
      rgba[j] = data[i]
      rgba[j + 1] = data[i + 1]
      rgba[j + 2] = data[i + 2]
      rgba[j + 3] = 255
    }
  } else if (kind === pdfjsLib.ImageKind.RGBA_32BPP) {
    rgba = new Uint8ClampedArray(data)
  } else {
    // Niveaux de gris et formats inattendus : on préfère ne rien proposer plutôt
    // qu'une image aux couleurs fausses.
    return null
  }
  ctx.putImageData(new ImageData(rgba, width, height), 0, 0)
  return canvas
}

function bitmapToCanvas(bitmap) {
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(bitmap, 0, 0)
  if (typeof bitmap.close === 'function') bitmap.close()
  return canvas
}

// Un même logo est souvent dessiné plusieurs fois sur une page : sans ce dédoublonnage
// sur les dimensions, il écraserait la photo au scoring.
const keyOf = (width, height) => `${width}x${height}`

// Un blob absent signifie que l'image n'a pas pu être décodée : dans les deux cas
// le candidat est écarté.
const unusable = (blob) => !blob || blob.size > MAX_BYTES

async function toBlob(image) {
  if (!image?.width || !image?.height) return null
  // Le moteur de rendu privilégie `bitmap` quand le JPEG a été décodé
  // nativement, et `data` (pixels bruts) sinon : les deux formes sont réelles.
  if (image.bitmap) return canvasToBlob(bitmapToCanvas(image.bitmap))
  if (image.data) {
    const canvas = putPixels(image.data, image.width, image.height, image.kind)
    return canvas ? canvasToBlob(canvas) : null
  }
  return null
}

// La plus grande image gagne ; à surface égale, la plus carrée, car une photo de
// CV est typiquement un portrait ou un carré, pas une bannière.
function best(candidates) {
  return candidates.reduce((top, item) => {
    if (!top) return item
    const area = item.width * item.height
    const topArea = top.width * top.height
    if (area !== topArea) return area > topArea ? item : top
    const ratio = Math.abs(item.width / item.height - 1)
    const topRatio = Math.abs(top.width / top.height - 1)
    return ratio < topRatio ? item : top
  }, null)
}

const resolveObj = (objs, id) =>
  new Promise((resolve) => {
    try {
      objs.get(id, resolve)
    } catch {
      resolve(null)
    }
  })

/**
 * Cherche une photo dans un PDF : la plus grande image matricielle de la
 * première page. Seule cette page est lue - une photo de CV est dans l'en-tête,
 * et parcourir le reste ferait de l'import une opération de plusieurs secondes.
 */
async function fromPdf(file) {
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
  try {
    const page = await doc.getPage(1)
    const { fnArray, argsArray } = await page.getOperatorList()
    const candidates = []
    const seen = new Set()

    for (let i = 0; i < fnArray.length; i += 1) {
      const fn = fnArray[i]
      let image = null
      if (fn === pdfjsLib.OPS.paintImageXObject) {
        image = await resolveObj(page.objs, argsArray[i][0])
      } else if (fn === pdfjsLib.OPS.paintInlineImageXObject) {
        image = argsArray[i][0]
      } else {
        continue
      }
      const { width, height } = image || {}
      if (!width || !height) continue
      if (width < MIN_SIDE || height < MIN_SIDE) continue
      // Un même logo est souvent dessiné plusieurs fois sur une page : sans ce
      // dédoublonnage sur les dimensions, il écraserait la photo au scoring.
      const key = keyOf(width, height)
      if (seen.has(key)) continue
      seen.add(key)
      const blob = await toBlob(image)
      if (unusable(blob)) continue
      candidates.push({ blob, width, height })
    }

    return best(candidates)?.blob || null
  } finally {
    await doc.destroy()
  }
}

/**
 * Cherche une photo dans un DOCX. mammoth ne rend le texte que par défaut, mais
 * `convertImage` permet de récupérer les images inline ; chacune est mesurée pour
 * écarter les logos, qu'on ne peut pas distinguer d'une photo sur leur seule
 * présence dans le flux.
 */
async function fromDocx(file) {
  const images = []
  await mammoth.convertToHtml(
    { arrayBuffer: await file.arrayBuffer() },
    {
      convertImage: mammoth.images.imgElement((image) =>
        image.readAsBase64String().then((b64) => {
          images.push({ b64, type: image.contentType })
          // Le HTML produit est jeté : seule l'image nous intéresse.
          return { src: '' }
        }),
      ),
    },
  )
  if (!images.length) return null

  const candidates = []
  for (const image of images) {
    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(image.type || '')) continue
    const blob = base64ToBlob(image.b64, image.type)
    if (unusable(blob)) continue
    const size = await bitmapSize(blob)
    if (!size) continue
    if (size.width < MIN_SIDE || size.height < MIN_SIDE) continue
    candidates.push({ blob, ...size })
  }
  return best(candidates)?.blob || null
}

function base64ToBlob(base64, type) {
  if (!base64) return null
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type })
}

async function bitmapSize(blob) {
  try {
    const bitmap = await createImageBitmap(blob)
    const size = { width: bitmap.width, height: bitmap.height }
    if (typeof bitmap.close === 'function') bitmap.close()
    return size
  } catch {
    return null
  }
}

/**
 * Point d'entrée unique de l'extraction de photo à l'import.
 *
 * Renvoie toujours `null` en cas de difficulté : une photo introuvable ou
 * illisible doit dégrader l'import, jamais le faire échouer.
 *
 * @returns {Promise<Blob|null>}
 */
export default async function extractImportPhoto(file) {
  const name = (file?.name || '').toLowerCase()
  try {
    if (name.endsWith('.pdf')) return await fromPdf(file)
    if (name.endsWith('.docx')) return await fromDocx(file)
  } catch (error) {
    console.warn('[import] extraction de la photo impossible', error)
  }
  return null
}