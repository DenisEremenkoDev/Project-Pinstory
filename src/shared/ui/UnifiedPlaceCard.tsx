import { MOOD_EMOJI, MOOD_LABELS, type PlaceDto } from '../lib/apiTypes'
import styles from './UnifiedPlaceCard.module.css'

interface UnifiedPlaceCardProps {
  place: PlaceDto
  onOpen: (id: string) => void
  onOpenOnMap?: (place: PlaceDto) => void
}

export function UnifiedPlaceCard({ place, onOpen, onOpenOnMap }: UnifiedPlaceCardProps) {
  return (
    <div
      className={styles.card}
      onClick={() => onOpen(place.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onOpen(place.id)
      }}
      role="button"
      tabIndex={0}
    >
      <div className={styles.photo}>
        {place.photoUrl ? (
          <img src={place.photoUrl} alt={place.name} className={styles.photoImg} />
        ) : (
          <span className="material-symbols-rounded">image</span>
        )}

        {place.mood && (
          <span className={styles.moodChip}>
            {MOOD_EMOJI[place.mood]} {MOOD_LABELS[place.mood]}
          </span>
        )}

        {onOpenOnMap && (
          <button
            type="button"
            className={styles.geoButton}
            aria-label="Показать на карте"
            onClick={(event) => {
              event.stopPropagation()
              onOpenOnMap(place)
            }}
          >
            <span className="material-symbols-rounded">near_me</span>
          </button>
        )}

        {place.myFeedback && (
          <span className={`${styles.feedbackIcon} ${styles[place.myFeedback]}`}>
            <span className="material-symbols-rounded material-symbols-rounded--filled">
              {place.myFeedback === 'like' ? 'favorite' : 'flag'}
            </span>
          </span>
        )}
      </div>

      <div className={styles.body}>
        <span className={styles.title}>{place.name}</span>
      </div>
    </div>
  )
}
