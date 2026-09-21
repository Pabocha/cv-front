import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Footer } from '../layouts/PublicLayout'
import { getTemplateThumbnailUrl } from '../api/templates'

const TEMPLATES_HIGHLIGHT = [
  { slug: 'professionnel', name: 'Professionnel' },
  { slug: 'moderne', name: 'Moderne' },
  { slug: 'executif', name: 'Exécutif' },
]

const STEPS = [
  {
    num: '1',
    title: 'Créez votre profil',
    desc: 'Renseignez vos informations : parcours, expériences, formations, compétences.',
  },
  {
    num: '2',
    title: 'Générez votre contenu',
    desc: 'Un contenu clair et bien structuré est créé à partir de vos informations.',
  },
  {
    num: '3',
    title: 'Choisissez un modèle',
    desc: 'Sélectionnez parmi plusieurs styles professionnels et adaptés à votre poste.',
  },
  {
    num: '4',
    title: 'Téléchargez votre CV',
    desc: 'Prévisualisez votre CV et téléchargez-le en PDF, prêt à envoyer.',
  },
]

const FEATURES = [
  {
    title: 'CV professionnel',
    desc: 'Un contenu clair, structuré et qui met en valeur votre parcours.',
  },
  {
    title: 'Adapté à votre poste',
    desc: 'Votre CV est pensé pour le métier et les mots-clés de votre secteur.',
  },
  {
    title: 'Compatible ATS',
    desc: 'Optimisé pour les systèmes de tri automatique utilisés par les recruteurs.',
  },
  {
    title: 'Analyse d’une offre',
    desc: 'Comparez votre CV à une offre d’emploi et obtenez un score de compatibilité.',
  },
  {
    title: 'Adaptation à une offre',
    desc: 'Reformulez et réorganisez vos informations pour coller à une offre précise.',
  },
  {
    title: 'Plusieurs styles',
    desc: 'Choisissez parmi des modèles professionnels, modernes, élégants ou colorés.',
  },
  {
    title: 'Téléchargement PDF',
    desc: 'Un PDF propre et imprimable, envoyable en un clic.',
  },
  {
    title: 'Lettre de motivation',
    desc: 'Une lettre factuelle rédigée à partir de vos informations réelles.',
  },
  {
    title: 'Accompagnement candidature',
    desc: 'Améliorez vos chances avec des recommandations concrètes à chaque étape.',
  },
  {
    title: 'Commandez votre CV',
    desc: 'Une équipe s’occupe de tout via WhatsApp, vous payez à la livraison.',
  },
]

const PLANS = [
  {
    name: 'Premium',
    price: '3 000 FCFA',
    period: '/ mois',
    highlight: true,
    features: [
      'Création et génération de CV illimitées',
      'Tous les modèles (6 styles)',
      'Téléchargement PDF illimité',
      'Analyse ATS et adaptation illimitées',
      '2 lettres de motivation / mois',
      'Support prioritaire',
    ],
    cta: 'Découvrir les options',
    to: '/pricing',
  },
  {
    name: 'Premium+',
    price: '5 000 FCFA',
    period: '/ mois',
    highlight: false,
    features: [
      'Tout le Premium, sans limite',
      'Lettres de motivation illimitées',
      'Support prioritaire renforcé',
      'Nouveaux modèles en avant-première',
    ],
    cta: 'Découvrir les options',
    to: '/pricing',
  },
  {
    name: 'À la carte',
    price: '3 000 FCFA',
    period: ' / CV',
    highlight: false,
    features: [
      'Sans compte, sans abonnement',
      'Génération de votre CV à partir d’une description',
      'Choix parmi les 6 modèles',
      'Téléchargement PDF en 1 clic',
      'Lien valable 48 h',
    ],
    cta: 'Créer mon CV sans compte',
    to: '/creer-cv',
  },
]

const FAQ = [
  {
    q: 'Est-ce que je peux créer plusieurs CV ?',
    a: 'Oui. Vous pouvez créer plusieurs CV, chacun avec un poste visé et un modèle différent, pour cibler plusieurs candidatures.',
  },
  {
    q: 'Mes informations restent-elles confidentielles ?',
    a: 'Absolument. Seules vos données vous concernent : elles servent uniquement à construire votre CV et ne sont jamais partagées.',
  },
  {
    q: 'Pourquoi mon CV est compatible ATS ?',
    a: 'Les recruteurs utilisent souvent des logiciels qui lisent et classent les CV. Nos modèles sont pensés pour être correctement lus par ces systèmes.',
  },
  {
    q: 'Puis-je adapter mon CV à une offre précise ?',
    a: 'Oui : collez le descriptif de l’offre, et le système réorganise vos informations en conséquence — sans jamais inventer de compétence.',
  },
  {
    q: 'Comment fonctionne le paiement ?',
    a: 'La création de compte est gratuite, mais toutes les fonctionnalités de CV nécessitent une offre Premium (3 000 FCFA/mois) ou Premium+ (5 000 FCFA/mois), activable en 2 clics. Sans compte, vous pouvez aussi payer 3 000 FCFA à la carte pour un seul CV. Le paiement est simulé dans cette démo (Wave, mobile money et carte en production).',
  },
  {
    q: 'Puis-je créer un CV sans compte ?',
    a: 'Oui : décrivez votre parcours, choisissez un modèle et payez à la carte (3 000 FCFA) pour télécharger le PDF immédiatement. Le lien de téléchargement reste valable 48 h.',
  },
  {
    q: 'Sans abonnement, puis-je tout de même créer mon CV ?',
    a: 'Oui via l’option à la carte sans compte, ou en commandant votre CV sur WhatsApp : notre équipe le crée pour vous et vous payez à la livraison.',
  },
  {
    q: 'Combien de lettres de motivation puis-je générer ?',
    a: 'Le forfait Premium inclut 2 lettres par mois, rédigées uniquement à partir de vos informations réelles. Premium+ permet des lettres illimitées.',
  },
  {
    q: 'Je ne sais pas créer de CV, que faire ?',
    a: 'Commandez-le sur WhatsApp : remplissez le formulaire (nom, numéro, parcours), nous créons votre CV et vous l’envoyons sur WhatsApp. Vous payez à la livraison.',
  },
]

export default function LandingPage() {
  return (
    <div>
      <Hero />
      <Thumbnails />
      <HowItWorks />
      <Features />
      <Templates />
      <Adapt />
      <Pricing />
      <Faq />
      <FinalCta />
      <Footer />
    </div>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-600 to-indigo-800">
      <div className="mx-auto max-w-3xl px-6 pb-24 pt-20 text-center text-white">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Créez votre CV professionnel en quelques minutes
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-indigo-100">
          Un CV clair, bien structuré et adapté au poste que vous recherchez.
          Compatible avec les logicielles de tri des recruteurs, téléchargeable en PDF.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/creer-cv"
            className="inline-block rounded-lg bg-white px-8 py-3 text-base font-semibold text-indigo-700 shadow hover:bg-indigo-50"
          >
            Créer mon CV sans compte
          </Link>
          <a
            href="#fonctionnalites"
            className="inline-block rounded-lg border border-white/40 px-8 py-3 text-base font-medium text-white hover:bg-white/10"
          >
            Découvrir
          </a>
        </div>
        <div className="mt-10 grid grid-cols-3 gap-4 text-sm text-indigo-100">
          <Stat value="6+" label="Modèles professionnels" />
          <Stat value="100%" label="Compatibles ATS" />
          <Stat value="3 000 FCFA" label="Tarif Premium mensuel" />
        </div>
      </div>
    </section>
  )
}

function Stat({ value, label }) {
  return (
    <div className="rounded-lg bg-white/10 px-4 py-3">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-indigo-200">{label}</div>
    </div>
  )
}

function Thumbnails() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-3">
          {TEMPLATES_HIGHLIGHT.map((tpl) => (
            <div
              key={tpl.slug}
              className="overflow-hidden rounded-lg border border-slate-200 shadow-sm"
            >
              <div className="pointer-events-none h-64 overflow-hidden bg-slate-100">
                <img
                  src={getTemplateThumbnailUrl(tpl.slug)}
                  alt={`Aperçu ${tpl.name}`}
                  loading="lazy"
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <div className="px-4 py-3 text-sm font-medium text-slate-700">
                {tpl.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section className="bg-slate-50 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center text-3xl font-bold text-slate-900">
          Comment ça marche ?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-500">
          Quatre étapes simples, pensées pour ceux qui ne sont pas à l’aise avec
          l’informatique.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className="rounded-xl border border-slate-200 bg-white p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-base font-bold text-white">
                {step.num}
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="fonctionnalites" className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center text-3xl font-bold text-slate-900">
          Tout pour réussir vos candidatures
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-slate-200 bg-slate-50 p-6"
            >
              <h3 className="text-base font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Templates() {
  return (
    <section id="modeles" className="bg-slate-50 py-16">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h2 className="text-3xl font-bold text-slate-900">
          Des modèles pour chaque profil
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-slate-500">
          Professionnel, moderne, élégant, exécutif, ingénieur ou coloré :
          choisissez le style qui correspond à votre métier.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            to="/creer-cv"
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Voir tous les modèles
          </Link>
        </div>
      </div>
    </section>
  )
}

function Adapt() {
  return (
    <section id="adaptation" className="bg-white py-16">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">
            Votre CV, parfaitement en phase avec l’offre
          </h2>
          <p className="mt-4 text-slate-600">
            Collez le descriptif de l’offre d’emploi. Le système analyse votre CV,
            calcule sa compatibilité et vous explique précisément quoi améliorer.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-600">
            <li className="flex gap-2">
              <span className="font-bold text-green-600">✓</span>
              Un score de compatibilité clair et expliqué.
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-green-600">✓</span>
              Compétences présentes et manquantes identifiées.
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-green-600">✓</span>
              Adaptation de vos informations existantes — jamais de contenu inventé.
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-green-600">✓</span>
              Recommandations concrètes pour maximiser vos chances.
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 shadow-sm">
          <div className="text-center">
            <div className="text-sm font-medium text-slate-500">Compatibilité actuelle</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">78 / 100</div>
            <div className="mt-2 text-sm text-slate-600">
              Bonne compatibilité, quelques ajustements recommandés.
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <Rec line="✔ Compétences techniques présentes : Django, PostgreSQL" />
            <Rec line="✖ À ajouter si elles correspondent à votre profil : Docker" />
            <Rec line="✖ Expérience : 3 ans demandés, votre CV en indique 2" />
            <Rec line="💡 Adapter votre CV à cette offre peut améliorer votre score" />
          </div>
          <div className="mt-6 rounded-lg bg-indigo-600 py-2.5 text-center text-sm font-medium text-white">
            Adapter mon CV à cette offre
          </div>
        </div>
      </div>
    </section>
  )
}

function Rec({ line }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
      {line}
    </div>
  )
}

function Pricing() {
  return (
    <section id="tarifs" className="bg-slate-50 py-16">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-center text-3xl font-bold text-slate-900">
          Des tarifs simples et accessibles
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-500">
          Un compte gratuit, et toutes les fonctionnalités incluses dans une
          offre Premium. Sans compte, payez à la carte pour un seul CV.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 ${
                plan.highlight
                  ? 'border-indigo-600 bg-white shadow-lg ring-2 ring-indigo-600'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                <span className="text-sm text-slate-500">{plan.period}</span>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-slate-600">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex gap-2">
                    <span className="text-green-600">✓</span>
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                to={plan.to}
                className={`mt-6 block rounded-lg py-2.5 text-center text-sm font-medium ${
                  plan.highlight
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'border border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          Paiement simulé en démo (Wave, mobile money et carte disponibles en
          production). Aucun frais caché.
        </p>
      </div>
    </section>
  )
}

function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section id="faq" className="bg-white py-16">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-center text-3xl font-bold text-slate-900">
          Questions fréquentes
        </h2>
        <div className="mt-8 space-y-3">
          {FAQ.map((item, i) => (
            <div
              key={item.q}
              className="rounded-xl border border-slate-200 bg-slate-50"
            >
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-slate-900"
              >
                {item.q}
                <span className="text-indigo-600">{open === i ? '−' : '+'}</span>
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-sm text-slate-600">{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="bg-indigo-600 py-16">
      <div className="mx-auto max-w-3xl px-6 text-center text-white">
        <h2 className="text-3xl font-bold">Prêt à faire décoller vos candidatures ?</h2>
        <p className="mt-3 text-indigo-100">
          Créez votre CV vous-même, ou faites-le créer pour vous via WhatsApp.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/creer-cv"
            className="inline-block rounded-lg bg-white px-8 py-3 text-base font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            Créer mon CV sans compte
          </Link>
          <Link
            to="/pricing"
            className="inline-block rounded-lg border border-white/40 px-8 py-3 text-base font-medium text-white hover:bg-white/10"
          >
            Voir les tarifs
          </Link>
        </div>
      </div>
    </section>
  )
}