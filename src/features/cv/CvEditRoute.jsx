import { useParams } from 'react-router-dom'
import CvEditPage from './CvEditPage'

// L'éditeur conserve son brouillon en mémoire : sans `key`, passer de /cv/1/edit à
// /cv/2/edit réutilise la même instance et son autosave viserait l'ancien CV.
export default function CvEditRoute() {
  const { id } = useParams()
  return <CvEditPage key={id} />
}
