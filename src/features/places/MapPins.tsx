import { projectToPercent } from '../../shared/lib/mapProjection'
import type { PlaceDto } from '../../shared/lib/apiTypes'
import styles from './MapPins.module.css'

export interface MapPinItem {
  place: PlaceDto
  variant?: 'shared' | 'friend-only'
}

export interface MapLayer {
  source: 'own' | 'friend'
  places: MapPinItem[]
}

interface MapPinsProps {
  layers: MapLayer[]
  selectedPlaceId: string | null
  onPinTap: (place: PlaceDto) => void
  myLocation?: { latitude: number; longitude: number } | null
}

// Renders every pin layer (own places + an optional friend overlay layer)
// from one array, per CLAUDE.md: the map must accept `layers` rather than a
// single hardcoded list, since the friend overlay needs a second pin layer.
export function MapPins({ layers, selectedPlaceId, onPinTap, myLocation }: MapPinsProps) {
  return (
    <>
      {layers.map((layer) =>
        layer.places.map(({ place, variant }) => {
          const { top, left } = projectToPercent(place.latitude, place.longitude)
          const className =
            layer.source === 'own'
              ? `${styles.pin} ${selectedPlaceId === place.id ? styles.pinSelected : ''}`
              : `${styles.friendPin} ${variant === 'shared' ? styles.friendPinShared : styles.friendPinOnly}`

          return (
            <button
              key={`${layer.source}-${place.id}`}
              type="button"
              className={className}
              style={{ top: `${top}%`, left: `${left}%` }}
              aria-label={place.name}
              onClick={(event) => {
                event.stopPropagation()
                onPinTap(place)
              }}
            />
          )
        }),
      )}

      {myLocation &&
        (() => {
          const { top, left } = projectToPercent(myLocation.latitude, myLocation.longitude)
          return (
            <div
              className={styles.myLocationDot}
              style={{ top: `${top}%`, left: `${left}%` }}
              aria-hidden="true"
            />
          )
        })()}
    </>
  )
}
