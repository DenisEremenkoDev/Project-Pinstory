import { useState } from 'react'
import { Avatar } from '../../shared/ui/Avatar'
import { UnifiedPlaceCard } from '../../shared/ui/UnifiedPlaceCard'
import { formatLongRuDate } from '../../shared/lib/formatDate'
import { getApiErrorMessage } from '../../shared/lib/getApiErrorMessage'
import type { FeedItemDto, FeedItemType } from '../../shared/lib/apiTypes'
import { useCreatePlaceMutation } from '../places/placesApi'
import styles from './FeedItemCard.module.css'

const ACTION_LABELS: Record<FeedItemType, string> = {
  place_added: 'добавил(а) новое место',
  wants_to_visit: 'хочет посетить',
  story_added: 'добавил(а) историю',
}

interface FeedItemCardProps {
  item: FeedItemDto
  onOpenPlace: (id: string) => void
}

export function FeedItemCard({ item, onOpenPlace }: FeedItemCardProps) {
  const [createPlace, { isLoading }] = useCreatePlaceMutation()
  const [isAdded, setAdded] = useState(false)
  const [error, setErrorMessage] = useState<string | null>(null)

  async function handleAddToMine() {
    setErrorMessage(null)
    try {
      await createPlace({
        name: item.place.name,
        latitude: item.place.latitude,
        longitude: item.place.longitude,
        rating: item.place.rating,
        note: null,
        tags: item.place.tags,
        status: 'want_to_visit',
        visibility: 'public',
        mood: null,
      }).unwrap()
      setAdded(true)
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, 'Не удалось добавить место'))
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.authorLine}>
        <Avatar id={item.author.id} name={item.author.displayName} avatarUrl={item.author.avatarUrl} size={32} />
        <span className={styles.authorText}>
          <strong>{item.author.displayName}</strong> {ACTION_LABELS[item.type]}
        </span>
        <span className={styles.date}>{formatLongRuDate(item.createdAt)}</span>
      </div>

      <UnifiedPlaceCard place={item.place} onOpen={onOpenPlace} />

      <div className={styles.actions}>
        {!item.place.isOwner && (
          <button
            type="button"
            className={styles.actionButton}
            disabled={isLoading || isAdded}
            onClick={handleAddToMine}
          >
            {isAdded ? 'Добавлено' : 'Добавить к себе'}
          </button>
        )}
        <button type="button" className={styles.actionButtonSecondary} onClick={() => onOpenPlace(item.place.id)}>
          Посмотреть
        </button>
      </div>

      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
