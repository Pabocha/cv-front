import { useCallback, useState } from 'react'
import { improveSection } from '../../api/ai'

/**
 * Amélioration d'une section du CV (bouton « ✨ Améliorer »).
 *
 * Le hook est unique par CV : le quota gratuit est journalier et global à
 * l'utilisateur, chaque champ ne peut donc pas afficher son propre compteur.
 * L'état « en cours » reste local à chaque champ (voir `ImproveField`).
 */
export default function useImprove(cvId) {
  const [quota, setQuota] = useState(null)

  const suggest = useCallback(
    async (payload) => {
      try {
        const { data } = await improveSection(cvId, payload)
        setQuota(data.quota || null)
        return data
      } catch (err) {
        // Quota épuisé : le serveur renvoie malgré tout l'état du quota dans
        // la réponse 429, on l'affiche tel quel plutôt qu'une erreur générique.
        if (err?.response?.status === 429) setQuota(err.response.data?.quota || null)
        throw err
      }
    },
    [cvId],
  )

  return { suggest, quota }
}
