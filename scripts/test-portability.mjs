// Harnais de portabilité du parseur PDF.
//
// Les fixtures sont des « items » fabriqués dans le format de `pdfItems.js` :
// c'est le contrat entre la lecture du PDF et le reste du pipeline qui est
// testé, pas la lecture elle-même (déjà couverte par les vrais PDF).
//
// Chaque cas décrit une mise en page que le parseur doit savoir traiter, ou un
// cas limite documenté. Un cas qui n'est pas encore géré le dit explicitement :
// il échoue, et l'échec est visible plutôt que masqué.
//
//   node scripts/test-portability.mjs          tous les cas
//   node scripts/test-portability.mjs en       un seul cas (substring du nom)
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = fileURLToPath(new URL('.', import.meta.url))
const ROOT = fileURLToPath(new URL('../src/features/cv/editor', import.meta.url))
const PDF_DIR = `${ROOT}/pdf`
const OUT_DIR = `${HERE}/.portability-build`
const BROWSER = new Set(['mammoth/mammoth.browser', 'pdfjs-dist'])
const url = (name) => pathToFileURL(`${OUT_DIR}/${name}.js`).href

const rewrite = (src) =>
  src.replace(/^import\s+([\s\S]*?)\s+from\s+'([^']+)'\s*$/gm, (_m, clause, spec) => {
    if (BROWSER.has(spec)) return ''
    if (spec.startsWith('../'))
      return `import ${clause} from '${pathToFileURL(`${ROOT}/${spec.replace(/^\.\.\//, '')}.js`).href}'`
    if (spec.startsWith('./')) return `import ${clause} from '${url(spec.replace(/^\.\//, ''))}'`
    return `import ${clause} from '${spec}'`
  })

// Copie du pipeline avec réécriture des specifiers : Node ne résout ni les
// chemins sans extension, ni les imports navigateur.
rmSync(OUT_DIR, { recursive: true, force: true })
mkdirSync(OUT_DIR, { recursive: true })
for (const file of readdirSync(PDF_DIR)) {
  if (!file.endsWith('.js') || file === 'pdfClient.js' || file === 'pdfItems.js') continue
  writeFileSync(`${OUT_DIR}/${file}`, rewrite(readFileSync(`${PDF_DIR}/${file}`, 'utf8')), 'utf8')
}

const { parseCvItems } = await import(url('parseCvItems'))
const { groupItemsIntoLines } = await import(url('lines'))
const { groupLinesIntoSections } = await import(url('sections'))

// --- Construction d'items synthétiques ---------------------------------------

let seq = 0
const it = (text, { x = 50, y = 700, bold = false, italic = false, font = 'Helvetica' } = {}) => ({
  text,
  x,
  y,
  width: Math.max(1, text.length * 5),
  height: 10,
  fontName: `${font}${bold ? '-Bold' : italic ? '-Italic' : ''}`,
  isBold: bold,
  isItalic: italic,
  hasEOL: false,
  page: 1,
  _id: seq++,
})

// Une « ligne » de l'item : plusieurs items fusionnés sur une même baseline.
const row = (y, cells) => cells.map((c) => it(c.t, { x: c.x, y, bold: c.b, italic: c.i }))

// --- Les cas -----------------------------------------------------------------
//
// `attendu` décrit ce que le parseur doit produire. `limite` signale un cas non
// résolu : il est volontairement hors du compte de réussite, pour que la
// couverture reste honnête au lieu d'être ajustée au résultat.

const CAS = {}

const cas = (nom, attendu, items) => {
  CAS[nom] = { attendu, items }
}

// 1. Une colonne, français, avec gras (le cas « Word par défaut »).
cas(
  '1col-fr-gras',
  {
    titres: 3,
    full_name: 'Jean Dupont',
    experiences: 2,
    educations: 1,
    resume: true,
    institution: 'Universite Paris-Saclay',
    company: 'Paris',
  },
  () => {
    const out = []
    let y = 760
    const put = (t, o = {}) => { out.push(...row(y, [{ t, x: 50, ...o }])); y -= 14 }
    put('Jean Dupont', { b: true })
    put('Developpeur Backend | Paris')
    put('jean.dupont@example.com')
    put('PROFIL', { b: true })
    put('Developpeur backend avec 5 ans d experience sur des APIs REST.')
    put('EXPERIENCES', { b: true })
    put('Societe X - Developpeur Django | Paris')
    put('2021 - 2024')
    put('Conception d API REST avec Django.')
    put('Societe Y - Developpeur Full Stack | Lyon')
    put('2019 - 2021')
    put('Migration du front vers React.')
    put('FORMATION', { b: true })
    put('Master Informatique - Universite Paris-Saclay')
    put('2017 - 2019')
    return out
  },
)

// 2. Une colonne, sans aucun gras ni italique : rien ne marque les titres.
cas(
  '1col-sans-gras',
  { titres: 2, full_name: 'Jean Dupont', experiences: 2 },
  () => {
    const out = []
    let y = 760
    const put = (t) => { out.push(...row(y, [{ t, x: 50 }])); y -= 14 }
    put('Jean Dupont')
    put('Developpeur Backend')
    put('jean.dupont@example.com')
    put('Profil')
    put('Developpeur backend avec 5 ans d experience.')
    put('Experiences')
    put('Societe X - Developpeur Django')
    put('2021 - 2024')
    put('Conception d API REST.')
    put('Societe Y - Developpeur Full Stack')
    put('2019 - 2021')
    put('Migration vers React.')
    return out
  },
)

// 3. Anglais, une colonne, gras : les mots-clés sont les seuls signes. La période
//    ouverte doit rester en anglais, sinon le formulaire affiche « Présent ».
cas(
  'en-1col',
  { lang: 'en', titres: 3, full_name: 'Jane Doe', experiences: 2, educations: 1, resume: true, date_range: '2021 - Present' },
  () => {
    const out = []
    let y = 760
    const put = (t, o = {}) => { out.push(...row(y, [{ t, x: 50, ...o }])); y -= 14 }
    put('Jane Doe', { b: true })
    put('Backend Engineer | Berlin')
    put('jane.doe@example.com')
    put('SUMMARY', { b: true })
    put('Backend engineer with 5 years building REST APIs.')
    put('EXPERIENCE', { b: true })
    put('Acme - Backend Engineer')
    put('2021 - Present')
    put('Designed REST APIs with Django and PostgreSQL.')
    put('Globex - Full Stack Developer')
    put('2019 - 2021')
    put('Migrated the frontend to React.')
    put('EDUCATION', { b: true })
    put('MSc Computer Science - TU Berlin')
    put('2017 - 2019')
    return out
  },
)

// 4. Un titre de section justifié, réécrit par le générateur en deux items collés
//    avec une fausse espace : « EXPE » + « RIENCES ».
cas(
  'titre-multi-items',
  { titres: 1, full_name: 'Jean Dupont', experiences: 1, date_range: '2021 - 2024' },
  () => {
    const out = []
    let y = 760
    const put = (cells) => { out.push(...row(y, cells)); y -= 14 }
    put([{ t: 'Jean Dupont', x: 50, b: true }])
    put([{ t: 'jean.dupont@example.com', x: 50 }])
    put([{ t: 'EXPE', x: 50, b: true }, { t: 'RIENCES', x: 90, b: true }])
    put([{ t: 'Societe X - Developpeur Django', x: 50 }])
    put([{ t: '2021 - 2024', x: 400 }])
    put([{ t: 'Conception d API REST.', x: 50 }])
    return out
  },
)

// 5. Puces et sous-titres : les réalisations vont dans `achievements`, les
//    sous-titres de projet restent dans `description`.
cas(
  'puces-sous-titres',
  {
    titres: 1,
    experiences: 1,
    puces: true,
    description: 'Plateforme de commande de repas\nPlateforme SaaS de gestion scolaire',
  },
  () => {
    const out = []
    let y = 760
    const put = (t, o = {}) => { out.push(...row(y, [{ t, x: 50, ...o }])); y -= 14 }
    put('EXPERIENCES', { b: true })
    put('Societe X - Developpeur Django')
    put('2021 - 2024')
    put('Plateforme de commande de repas', { i: true })
    put('- Developpement de l application mobile')
    put('- Integration des paiements Orange Money')
    put('Plateforme SaaS de gestion scolaire', { i: true })
    put('- Conception d une architecture multi-tenant')
    return out
  },
)

// 6. Titre en capitales espacées lettre par lettre : PDF.js le rend en un seul
//    item dont les frontières de mots sont irrécupérables. Limite connue, cas
//    volontairement hors du compte de réussite.
cas(
  'titre-lettrespacees',
  { limite: 'Les frontières de mots sont perdues par PDF.js, rien à faire ici.' },
  () => {
    const out = []
    let y = 760
    const put = (t, o = {}) => { out.push(...row(y, [{ t, x: 50, ...o }])); y -= 14 }
    put('Jean Dupont', { b: true })
    put('D E V E L O P P E U R   B A C K E N D')
    put('jean.dupont@example.com')
    put('PROFIL', { b: true })
    put('Developpeur backend.')
    return out
  },
)

// 7. Trois colonnes : le détecteur de gouttière n'en trouve qu'une, la troisième
//    colonne est perdue. Limite connue.
cas(
  '3col',
  { limite: 'Le partage en colonnes ne gère que deux colonnes.' },
  () => {
    const out = []
    for (const [x0, label] of [[20, 'CONTACT'], [200, 'PROFIL'], [380, 'EXPERIENCES']]) {
      let y = 760
      const put = (t) => { out.push(...row(y, [{ t, x: x0 }])); y -= 13 }
      put(label)
      put(`${label} contenu un deux trois`)
      put('autre ligne de texte ici')
      put('et une troisieme ligne')
      put('quatrieme ligne de contenu')
    }
    return out
  },
)

// 8. Deux colonnes dont la droite est bien plus courte. Le seuil de répartition
//    verticale refuse ce faux partage : la sidebar courte est perdue. Limite
//    assumée, elle protège le cas à deux colonnes équilibrées.
cas(
  '2col-desequilibre',
  { limite: 'Une colonne trop courte est absorbée par l autre.' },
  () => {
    const out = []
    for (const [x0, n] of [[20, 20], [300, 6]]) {
      let y = 760
      for (let i = 0; i < n; i += 1) {
        out.push(...row(y, [{ t: `ligne ${i} de contenu`, x: x0 }]))
        y -= 13
      }
    }
    return out
  },
)

// --- Vérifications ------------------------------------------------------------

const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  return { ok, label, actual, expected }
}

const verifications = (parsed, attendu) => {
  const out = []
  const count = (key) => (Array.isArray(parsed.sections?.[key]) ? parsed.sections[key].length : 0)
  const firstExp = parsed.sections?.experiences?.[0] || {}

  if (attendu.titres !== undefined)
    out.push(check('titres détectés', parsed.detectedTitles, attendu.titres))
  if (attendu.full_name !== undefined)
    out.push(check('nom', parsed.header?.full_name ?? null, attendu.full_name))
  if (attendu.experiences !== undefined)
    out.push(check('expériences', count('experiences'), attendu.experiences))
  if (attendu.educations !== undefined)
    out.push(check('formations', count('educations'), attendu.educations))
  if (attendu.resume) out.push(check('résumé non vide', parsed.summary.length > 0, true))
  if (attendu.date_range !== undefined)
    out.push(check('période', firstExp.date_range ?? null, attendu.date_range))
  if (attendu.company !== undefined)
    out.push(check('entreprise', firstExp.company ?? null, attendu.company))
  if (attendu.institution !== undefined)
    out.push(check('établissement', parsed.sections?.educations?.[0]?.institution ?? null, attendu.institution))
  if (attendu.puces) {
    const achievements = firstExp.achievements || ''
    out.push(check('puces en achievements', /^- /m.test(achievements), true))
    out.push(check('puces hors de description', /^- /m.test(firstExp.description || ''), false))
  }
  if (attendu.description)
    out.push(check('description', (firstExp.description || '').trim(), attendu.description))
  return out
}

// --- Exécution ----------------------------------------------------------------

const only = process.argv[2]
let ok = 0
let ko = 0
const limites = []

for (const [name, { attendu, items: build }] of Object.entries(CAS)) {
  if (only && !name.includes(only)) continue

  const items = build()
  const parsed = parseCvItems(items, attendu.lang || 'fr')

  console.log(`\n=== ${name} ===`)
  if (attendu.limite) {
    limites.push({ name, motif: attendu.limite })
    console.log(`  limite connue : ${attendu.limite}`)
    console.log(`  titres détectés : ${parsed.detectedTitles} (non vérifié)`)
    continue
  }

  const results = verifications(parsed, attendu)
  for (const r of results) {
    console.log(`  ${r.ok ? 'OK  ' : 'ECHEC'} ${r.label} : ${JSON.stringify(r.actual)}`)
    if (!r.ok) console.log(`        attendu : ${JSON.stringify(r.expected)}`)
    if (r.ok) ok += 1
    else ko += 1
  }
}

console.log(`\n${ok} vérifications passées, ${ko} en échec`)
if (limites.length) {
  console.log(`${limites.length} limites connues, volontairement non vérifiées :`)
  for (const l of limites) console.log(`  - ${l.name} : ${l.motif}`)
}
if (ko) process.exitCode = 1

rmSync(OUT_DIR, { recursive: true, force: true })
