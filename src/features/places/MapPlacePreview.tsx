import type { PlaceDto } from '../../shared/lib/apiTypes'
import { MOOD_EMOJI, MOOD_LABELS, PLACE_STATUS_LABELS } from '../../shared/lib/apiTypes'
import { gradientForId } from '../../shared/lib/gradientPalette'
import styles from './MapPlacePreview.module.css'

interface MapPlacePreviewProps {
  place: PlaceDto
  onOpen: () => void
  onDismiss: () => void
}

export function MapPlacePreview({ place, onOpen, onDismiss }: MapPlacePreviewProps) {
  return (
    <div
      className={styles.card}
      role="button"
      tabIndex={0}
      aria-label={`Открыть ${place.name}`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onOpen()
      }}
    >
      {place.photoUrl ? (
        <img src={place.photoUrl} alt={place.name} className={styles.thumb} />
      ) : (
        <div className={styles.thumbGradient} style={{ background: gradientForId(place.id) }} />
      )}

      <div className={styles.info}>
        <div className={styles.name}>{place.name}</div>
        <div className={styles.chips}>
          <span className={styles.chip}>{PLACE_STATUS_LABELS[place.status]}</span>
          {place.mood && (
            <span className={styles.chip}>
              {MOOD_EMOJI[place.mood]} {MOOD_LABELS[place.mood]}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        className={styles.closeButton}
        aria-label="Скрыть"
        onClick={(event) => {
          event.stopPropagation()
          onDismiss()
        }}
      >
        <span className="material-symbols-rounded">close</span>
      </button>
    </div>
  )
}
