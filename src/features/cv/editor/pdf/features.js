/**
 * Moteur de scoring par attributs.
 *
 * Chaque champ est décrit par une liste de fonctions « ce texte a-t-il cette
 * caractéristique ? » pondérées. Tous les candidats sont notés, et le mieux noté
 * gagne. L'intérêt par rapport à une cascade de regex : un candidat qui ressemble
 * à un nom mais contient un « @ » est écarté par la pénalité correspondante,
 * alors qu'une cascade l'aurait accepté.
 *
 * Chaque fonction peut renvoyer un objet `{text, groups}` : le texte à retenir
 * n'est alors pas l'item entier mais le fragment capturé (utile pour extraire
 * « 06 12 34 56 78 » d'une ligne qui contient aussi une adresse).
 */

/** Forme d'un jeu de fonctions : [[prédicat, poids, garderLeFragment?], ...] */
function computeFeatureScores(items, featureSets) {
  // Table d'indexation : chaque item garde une entrée unique, même si deux items
  // portent exactement le même texte (cas d'un nom répété en en-tête).
  const entries = new Map()
  const scores = items.map((item) => {
    const entry = { text: item.text, score: 0, item, extracted: false }
    entries.set(item, entry)
    return entry
  })

  for (const item of items) {
    const entry = entries.get(item)
    for (const featureSet of featureSets) {
      const [hasFeature, weight, keepMatch] = featureSet
      const result = hasFeature(item)
      if (!result) continue

      if (keepMatch && typeof result === 'object') {
        const text = result.text.trim()
        if (!text) continue
        if (text === item.text) {
          entry.score += weight
        } else {
          scores.push({ text, score: weight, item, extracted: true })
        }
      } else {
        entry.score += weight
      }
    }
  }

  return scores
}

/**
 * Renvoie le texte qui maximise le score cumulé de ses attributs.
 *
 * @param {boolean} requirePositiveScore abandonne si aucun candidat ne marque de point
 * @param {boolean} joinTies concatène les ex æquo plutôt que d'en garder un seul
 * @returns {[string, object[]]} le texte gagnant et le détail des scores
 */
export function getTextWithHighestFeatureScore(items, featureSets, requirePositiveScore = true, joinTies = false) {
  const scores = computeFeatureScores(items, featureSets)

  let best = []
  let highest = -Infinity
  for (const entry of scores) {
    if (entry.score < highest) continue
    if (entry.score > highest) best = []
    best.push(entry)
    highest = entry.score
  }

  if (requirePositiveScore && highest <= 0) return ['', scores]
  if (!best.length) return ['', scores]

  const text = joinTies
    ? best
        .map((entry) => entry.text.trim())
        .filter(Boolean)
        .join(' ')
    : best[0].text.trim()

  return [text, scores]
}
