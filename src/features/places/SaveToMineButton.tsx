import { useState } from 'react'
import type { PlaceDto } from '../../shared/lib/apiTypes'
import { getApiErrorMessage } from '../../shared/lib/getApiErrorMessage'
import { useCreatePlaceMutation } from './placesApi'
import styles from './SaveToMineButton.module.css'

interface SaveToMineButtonProps {
  place: PlaceDto
}

export function SaveToMineButton({ place }: SaveToMineButtonProps) {
  const [createPlace, { isLoading }] = useCreatePlaceMutation()
  const [isAdded, setAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (place.isOwner) return null

  async function handleAdd() {
    setError(null)
    try {
      await createPlace({
        name: place.name,
        latitude: place.latitude,
        longitude: place.longitude,
        rating: place.rating,
        note: null,
        tags: place.tags,
        status: 'want_to_visit',
        visibility: 'public',
        mood: null,
      }).unwrap()
      setAdded(true)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось добавить место'))
    }
  }

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.button}
        disabled={isLoading || isAdded}
        onClick={handleAdd}
      >
        <span className="material-symbols-rounded">{isAdded ? 'check' : 'bookmark_add'}</span>
        {isAdded ? 'Добавлено' : 'Добавить к себе'}
      </button>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
