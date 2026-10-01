import * as pdfjsLib from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// Point d'entrée unique vers pdf.js : le worker doit être configuré avant tout
// `getDocument`, sinon les appels échouent hors du contexte navigateur.
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

export { pdfjsLib }
