import api from './client'

/**
 * Propose des reformulations d'un champ du CV.
 *
 * L'IA ne modifie jamais le texte : elle renvoie des propositions que
 * l'utilisateur choisit d'appliquer ou non. Le champ `text` est envoyé en
 * texte brut, pas en HTML.
 */
export const improveSection = (id, payload) =>
  api.post(`/cvs/${id}/improve-section/`, payload)
