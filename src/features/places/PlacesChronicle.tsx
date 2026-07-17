import { useState } from 'react'
import { useNavigate } from 'react-router'
import { EmptyState } from '../../shared/ui/EmptyState'
import { ErrorState } from '../../shared/ui/ErrorState'
import { Loader } from '../../shared/ui/Loader'
import { UnifiedPlaceCard } from '../../shared/ui/UnifiedPlaceCard'
import { formatLongRuDate } from '../../shared/lib/formatDate'
import type { PlaceDto } from '../../shared/lib/apiTypes'
import { useGetPlacesQuery } from './placesApi'
import styles from './PlacesChronicle.module.css'

type ChronicleFilter = 'all' | 'liked' | 'disliked' | 'want_to_visit'

const FILTERS: { value: ChronicleFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'liked', label: '❤️ Понравилось' },
  { value: 'disliked', label: '🚩 Не понравилось' },
  { value: 'want_to_visit', label: 'Хочу посетить' },
]

const EMPTY_MESSAGES: Record<ChronicleFilter, string> = {
  all: 'Добавьте первое место через кнопку «+» внизу экрана',
  liked: 'Пока нет мест с отметкой «понравилось»',
  disliked: 'Пока нет мест с отметкой «не понравилось»',
  want_to_visit: 'Пока нет мест, которые вы хотите посетить',
}

interface PlacesChronicleProps {
  onOpenPlace: (id: string) => void
}

export function PlacesChronicle({ onOpenPlace }: PlacesChronicleProps) {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<ChronicleFilter>('all')
  const { data: places, isLoading, isError, refetch } = useGetPlacesQuery()

  function handleOpenOnMap(place: PlaceDto) {
    navigate('/map', { state: { focusPlaceId: place.id } })
  }

  const filteredPlaces = (places ?? []).filter((place) => {
    if (filter === 'all') return true
    if (filter === 'liked') return place.myFeedback === 'like'
    if (filter === 'disliked') return place.myFeedback === 'dislike'
    // "Запланировано" collapsed into "Хочу посетить" (2026-07-16) — this is
    // now simply "no recommendation set yet", not the raw creation-time status.
    return place.myFeedback === null
  })

  return (
    <div>
      <div className={styles.chips}>
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`${styles.chip} ${filter === item.value ? styles.active : ''}`}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Loader />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : filteredPlaces.length === 0 ? (
        <EmptyState icon="auto_stories" title="Пока пусто" description={EMPTY_MESSAGES[filter]} />
      ) : (
        <div className={styles.list}>
          {filteredPlaces.map((place, index) => {
            const dateLabel = formatLongRuDate(place.createdAt)
            const previousDateLabel =
              index > 0 ? formatLongRuDate(filteredPlaces[index - 1]!.createdAt) : null
            const showDateHeader = dateLabel !== previousDateLabel

            return (
              <div key={place.id}>
                {showDateHeader && <div className={styles.dateHeader}>{dateLabel}</div>}
                <UnifiedPlaceCard place={place} onOpen={onOpenPlace} onOpenOnMap={handleOpenOnMap} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
