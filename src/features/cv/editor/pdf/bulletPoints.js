// Puces reconnues en début de ligne, aussi bien dans un PDF que dans un texte.
export const BULLET_POINTS = ['•', '▪', '●', '‣', '⁃', '∙', '·', '-', '*']

// Puce en tête de ligne. Le trait doit être suivi d'au moins un espace, sinon
// « Université Paris-Saclay » serait amputé de son « S ».
export const BULLET_RE = /^\s*[•▪●‣⁃∙·*-]\s+/
