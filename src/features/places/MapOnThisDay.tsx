import { useState } from 'react'
import type { PlaceDto } from '../../shared/lib/apiTypes'
import { findOnThisDayMatches, yearsAgoLabel } from './onThisDayMatch'
import styles from './MapOnThisDay.module.css'

interface MapOnThisDayProps {
  places: PlaceDto[]
  onOpenPlace: (id: string) => void
}

// Own places added on this calendar day in a previous year — always shown
// when there's a match, no settings toggle (explicit maintainer decision,
// 2026-07-16). Computed client-side from the already-loaded own-places list;
// no new endpoint or DTO field.
export function MapOnThisDay({ places, onOpenPlace }: MapOnThisDayProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const matches = findOnThisDayMatches(places, new Date()).filter(({ place }) => !dismissedIds.has(place.id))

  if (matches.length === 0) return null

  return (
    <div className={styles.list}>
      {matches.map(({ place, years }) => (
        <div
          key={place.id}
          className={styles.card}
          onClick={() => onOpenPlace(place.id)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') onOpenPlace(place.id)
          }}
          role="button"
          tabIndex={0}
        >
          <span className={`material-symbols-rounded ${styles.icon}`}>auto_stories</span>
          <span className={styles.text}>
            <span className={styles.years}>{yearsAgoLabel(years)}</span>
            <span className={styles.name}>Вы сохранили «{place.name}»</span>
          </span>
          <span className="material-symbols-rounded">chevron_right</span>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Скрыть напоминание"
            onClick={(event) => {
              event.stopPropagation()
              setDismissedIds((prev) => new Set(prev).add(place.id))
            }}
          >
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>
      ))}
    </div>
  )
}
