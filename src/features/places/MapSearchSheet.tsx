import { useState } from 'react'
import { PLACE_STATUS_LABELS } from '../../shared/lib/apiTypes'
import { useGetPlacesQuery } from './placesApi'
import styles from './MapSearchSheet.module.css'

interface MapSearchSheetProps {
  onClose: () => void
  onOpenPlace: (id: string) => void
}

export function MapSearchSheet({ onClose, onOpenPlace }: MapSearchSheetProps) {
  const [searchText, setSearchText] = useState('')
  const { data: places } = useGetPlacesQuery()

  const query = searchText.trim().toLowerCase()
  const results = (places ?? []).filter((place) => !query || place.name.toLowerCase().includes(query))

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <button type="button" className={styles.backButton} onClick={onClose} aria-label="Назад">
          <span className="material-symbols-rounded">arrow_back</span>
        </button>
        <div className={styles.inputWrap}>
          <span className="material-symbols-rounded">search</span>
          <input
            autoFocus
            className={styles.input}
            placeholder="Искать места, воспоминания, настроения"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </div>
      </div>

      <span className={styles.sectionLabel}>Места</span>

      <div className={styles.results}>
        {results.map((place) => (
          <button
            key={place.id}
            type="button"
            className={styles.result}
            onClick={() => {
              onOpenPlace(place.id)
              onClose()
            }}
          >
            <span className="material-symbols-rounded">location_on</span>
            <div>
              <div className={styles.resultName}>{place.name}</div>
              <div className={styles.resultSub}>{PLACE_STATUS_LABELS[place.status]}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
