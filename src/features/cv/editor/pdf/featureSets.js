import { BULLET_POINTS } from './bulletPoints'

// --- Primitives ----------------------------------------------------------------

const text = (item) => item.text || ''

const hasLetter = (item) => /[a-zA-ZÀ-ÿ]/.test(text(item))
const hasNumber = (item) => /[0-9]/.test(text(item))
const hasComma = (item) => text(item).includes(',')
const hasSlash = (item) => text(item).includes('/')
const hasAt = (item) => text(item).includes('@')
const hasParenthesis = (item) => /\(.*\)/.test(text(item))
const hasBullet = (item) => BULLET_POINTS.includes(text(item).trim())
const isBold = (item) => !!item.isBold
const isAllUpperCase = (item) => hasLetter(item) && text(item) === text(item).toUpperCase()

const wordCount = (item) => text(item).trim().split(/\s+/).filter(Boolean).length
const has4OrMoreWords = (item) => wordCount(item) >= 4

// --- Nom ------------------------------------------------------------------------

// « Jean Martin », « Léon W. Nkoulou » — lettres, espaces, points et tirets.
const matchName = (item) => {
  const match = text(item).match(/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s.'’-]*$/)
  return match ? { text: match[0] } : false
}

export const NAME_FEATURE_SETS = [
  [matchName, 3, true],
  [isBold, 2],
  [isAllUpperCase, 2],
  // Pénalités : ce qui ressemble à un autre attribut.
  [hasAt, -4], // email
  [hasNumber, -4], // téléphone, année
  [hasParenthesis, -4], // téléphone
  [hasComma, -3], // localisation
  [hasSlash, -4], // url
  [has4OrMoreWords, -2], // résumé
]

// --- Email ---------------------------------------------------------------------

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
const matchEmail = (item) => {
  const match = text(item).match(EMAIL_RE)
  return match ? { text: match[0] } : false
}

export const EMAIL_FEATURE_SETS = [
  [matchEmail, 5, true],
  [hasAt, 1],
  [isBold, -1],
  [hasParenthesis, -4],
  [hasComma, -4],
  [hasSlash, -4],
]

// --- Téléphone ------------------------------------------------------------------

// Formats français (+33, 06…) et internationaux, séparateurs libres.
const PHONE_RE = /(?:\+|00)?(?:\d[\s.-]?){8,14}\d/
const matchPhone = (item) => {
  const match = text(item).match(PHONE_RE)
  return match ? { text: match[0] } : false
}

export const PHONE_FEATURE_SETS = [
  [matchPhone, 5, true],
  [(item) => (PHONE_RE.test(text(item)) ? 1 : 0), 1],
  [hasLetter, -4], // nom, email, ville, résumé
  [hasSlash, -3], // url
]

// --- Localisation ----------------------------------------------------------------

// Pays et régions fréquemment présents sur un CV francophone. La liste sert de
// Filtre : « Migration des données, PostgreSQL » respecte la forme « lieu, région »
// mais PostgreSQL n'est pas un territoire, donc la ligne ne vaut pas une ville.
// Sans cette liste, la forme seule produirait des localisations inventées.
const KNOWN_REGIONS = new Set([
  'france', 'belgique', 'suisse', 'luxembourg', 'canada', 'maroc', 'tunisie', 'algerie',
  'senegal', 'cote d ivoire', 'ivory coast', 'mali', 'burkina faso', 'niger', 'benin',
  'togo', 'ghana', 'nigeria', 'cameroun', 'cameroon', 'congo', 'gabon', 'equateur',
  'angola', 'guinee', 'sierra leone', 'gambie', 'mauritanie', 'gabon', 'reunion',
  'france métropolitaine', 'ile de france', 'ile-de-france', 'auvergne',
  'rhone alpes', 'rhône alpes', 'provence', 'occitanie', 'normandie', 'bretagne',
  'pays de la loire', 'nouvelle aquitaine', 'nouvelle-aquitaine', 'centre val de loire',
  'grand est', 'hauts de france', 'bourgogne', 'alsace', 'franche comte', 'corse',
  'united states', 'united kingdom', 'india', 'china', 'japan', 'brazil', 'spain',
  'italy', 'germany', 'portugal', 'senegal', 'guinea',
])

// « Paris, France », « Dakar, Sénégal », « Ile-de-France ». Les CV français
// écrivent rarement l'État sur deux lettres comme aux États-Unis : on privilégie
// donc la forme « lieu, région/pays ».
const CITY_REGION_RE = /^([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s'’.-]{1,30}),\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s'’.-]{1,30})$/

export const matchCityAndRegion = (item) => {
  const match = text(item).trim().match(CITY_REGION_RE)
  if (!match) return false
  return { text: match[1].trim(), region: match[2].trim(), known: KNOWN_REGIONS.has(match[2].trim().toLowerCase()) }
}

const matchKnownRegion = (item) => {
  const match = text(item).trim().match(CITY_REGION_RE)
  if (!match) return false
  return KNOWN_REGIONS.has(match[2].trim().toLowerCase()) ? { text: match[2].trim() } : false
}

// Forme forte (région connue) : +6. Forme faible : +2 seulement, et les autres
// attributs restent largement devant.
const matchCityStrong = (item) => {
  const result = matchCityAndRegion(item)
  return result && result.known ? result : false
}
const matchCityWeak = (item) => {
  const result = matchCityAndRegion(item)
  return result && !result.known ? result : false
}

// « GY-112 Liberté 6, Dakar » : l'adresse précède la ville, contrairement à la
// forme « lieu, région ». Le séparateur impose deux morceaux alphanumériques.
const matchAddressThenCity = (item) => {
  const value = text(item).trim()
  const match = value.match(/^(.*?[\d][^,]{0,40}),\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s'’-]{1,30})$/)
  if (!match) return false
  return { text: match[2].trim(), region: '', known: false, address: match[1].trim() }
}

export const LOCATION_FEATURE_SETS = [
  [matchCityStrong, 6, true],
  [matchCityWeak, 2, true],
  [matchAddressThenCity, 4, true],
  [isBold, -1],
  [hasAt, -4],
  [hasParenthesis, -3],
  [hasSlash, -4],
  [hasNumber, -3],
]

export const COUNTRY_FEATURE_SETS = [
  [matchKnownRegion, 5, true],
  [hasAt, -4],
  [hasNumber, -4],
]

// --- URL -------------------------------------------------------------------------

// Les TLD usuels sont figés pour ne pas confondre une URL avec «
// dvp.nlp » ou une phrase ponctuée. La liste reste volontairement large :
// « portfolio-zeta-snowy.vercel.app » est un site personnel légitime.
const URL_TLDS = [
  'com', 'fr', 'org', 'net', 'io', 'dev', 'co', 'me', 'tech', 'app', 'dev', 'ai',
  'info', 'biz', 'cloud', 'online', 'site', 'xyz', 'eu', 'uk', 'us', 'ca', 'be',
  'ch', 'de', 'es', 'it', 'nl', 'pt', 'ru', 'cn', 'jp', 'br', 'sn', 'ci', 'cm',
]

const BARE_URL_RE = new RegExp(
  String.raw`(?:^|[\s|(])([a-z0-9-]+(?:[.-][a-z0-9-]+)*\.(?:${URL_TLDS.join('|')})\/?(?:[^\s|),]*))`,
  'i',
)

const URL_PATTERNS = [
  /https?:\/\/[^\s|]+/i,
  /(?:^|[\s|,(])(www\.[\w-]+\.[a-z]{2,}[^\s|),]*)/i,
  BARE_URL_RE,
]

const matchUrl = (item) => {
  for (const pattern of URL_PATTERNS) {
    const match = text(item).match(pattern)
    if (match) {
      let url = (match[1] || match[0]).trim()
      if (/^[\s|,(]/.test(url)) url = url.replace(/^[\s|,(]/, '')
      if (/^www\./i.test(url)) url = `https://${url}`
      url = url.replace(/[.,;)]+$/, '')
      // Beaucoup de CV écrivent « linkedin.com/in/x » sans schéma : sans cette
      // normalisation, le routage vers LinkedIn échouerait sur une URL nue.
      return { text: /^[a-z]+:\/\//i.test(url) ? url : `https://${url}` }
    }
  }
  return false
}

export const URL_FEATURE_SETS = [
  [matchUrl, 5, true],
  [hasSlash, 1],
  [isBold, -1],
  [hasAt, -4],
  [hasParenthesis, -3],
  [hasComma, -4],
  [has4OrMoreWords, -3],
]

// --- Dates -----------------------------------------------------------------------

const MONTHS_FR = [
  'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
]
const MONTHS_EN = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
]

const hasYear = (item) => /\b(19|20)\d{2}\b/.test(text(item))
const hasMonthName = (item) => {
  const value = text(item).toLowerCase()
  const months = [...MONTHS_FR, ...MONTHS_EN]
  return months.some((month) => value.includes(month) || value.includes(month.slice(0, 3)))
}
const hasPresent = (item) => /(présent|present|en cours|actuel|actuelle|aujourd'hui|current|now)/i.test(text(item))
const hasDateRangeSep = (item) => /[–—]|\b(?:au|à|de|depuis|to|until)\b|\s-\s/i.test(text(item))

export const DATE_FEATURE_SETS = [
  [hasYear, 2],
  [hasMonthName, 2],
  [hasPresent, 1],
  [hasDateRangeSep, 1],
  [hasComma, -1],
]

// --- Résumé -----------------------------------------------------------------------

export const SUMMARY_FEATURE_SETS = [
  [has4OrMoreWords, 4],
  [isBold, -1],
  [hasAt, -4],
  [hasParenthesis, -3],
  [hasSlash, -4],
  [(item) => (matchCityAndRegion(item) ? -3 : 0), 0],
]

// --- Divers ------------------------------------------------------------------------

export const isBulletItem = hasBullet
export { hasLetter, hasNumber, hasComma, hasSlash, hasAt, hasParenthesis, isBold, isAllUpperCase, wordCount }
