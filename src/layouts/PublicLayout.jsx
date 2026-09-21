import { Link } from 'react-router-dom'

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-xl font-bold text-indigo-600">
            CVPro
          </Link>
          <div className="hidden items-center gap-6 text-sm md:flex">
            <a href="#fonctionnalites" className="text-slate-600 hover:text-indigo-600">
              Fonctionnalités
            </a>
            <a href="#modeles" className="text-slate-600 hover:text-indigo-600">
              Modèles
            </a>
            <Link to="/pricing" className="text-slate-600 hover:text-indigo-600">
              Tarifs
            </Link>
            <Link to="/commander" className="text-slate-600 hover:text-indigo-600">
              Commander sur WhatsApp
            </Link>
            <a href="#faq" className="text-slate-600 hover:text-indigo-600">
              FAQ
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-slate-600 hover:text-slate-900">
              Connexion
            </Link>
            <Link
              to="/creer-cv"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Créer mon CV
            </Link>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <h3 className="text-base font-bold text-indigo-600">CVPro</h3>
          <p className="mt-2 text-sm text-slate-500">
            Créez un CV professionnel, compatible avec les logicielles de tri, en
            quelques minutes.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Produit</h4>
          <ul className="mt-2 space-y-2 text-sm text-slate-500">
            <li><a href="#fonctionnalites" className="hover:text-indigo-600">Fonctionnalités</a></li>
            <li><a href="#modeles" className="hover:text-indigo-600">Modèles de CV</a></li>
            <li><Link to="/pricing" className="hover:text-indigo-600">Tarifs</Link></li>
            <li><Link to="/commander" className="hover:text-indigo-600">Commander sur WhatsApp</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Pour vous</h4>
          <ul className="mt-2 space-y-2 text-sm text-slate-500">
            <li>Demandeurs d'emploi</li>
            <li>Jeunes diplômés</li>
            <li>Professionnels en reconversion</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Contact</h4>
          <ul className="mt-2 space-y-2 text-sm text-slate-500">
            <li>support@cvpro.exemple</li>
            <li>Dakar, Sénégal</li>
            <li>Disponible en Afrique francophone</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} CVPro — CV professionnels pour le marché francophone africain.
      </div>
    </footer>
  )
}