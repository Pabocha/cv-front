/**
 * Reprise du parcours invité.
 *
 * Le token est la seule chose que possède un visiteur sans compte : il est
 * stocké dans le localStorage pour survivre à un rafraîchissement de page ou à
 * un retour le lendemain (le backend accorde 48 h). Il ne faut jamais le
 * conserver après une réclamation réussie : le CV appartient désormais au
 * compte.
 */
const TOKEN_KEY = 'cvpro.guest.token'

export function getGuestToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    /* localStorage indisponible (navigation privée) */
    return null
  }
}

export function setGuestToken(token) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token)
    else window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* rien à faire : le parcours reste utilisable en mémoire */
  }
}

export function clearGuestToken() {
  setGuestToken(null)
}
