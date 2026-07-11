import { useState } from 'react'
import type { MouseEvent } from 'react'
import { ComingSoon } from '../../../shared/ui/ComingSoon'
import { BottomSheet } from '../../../shared/ui/BottomSheet'
import { Loader } from '../../../shared/ui/Loader'
import { projectFromPercent } from '../../../shared/lib/mapProjection'
import { useGetPersonPlacesQuery } from '../../people/peopleApi'
import { AddPlaceForm } from '../AddPlaceForm'
import { PlaceDetailView } from '../PlaceDetailView'
import { MapSearchSheet } from '../MapSearchSheet'
import { MapFriendPicker } from '../MapFriendPicker'
import { MapFriendOverlay } from '../MapFriendOverlay'
import { MapPins, type MapLayer } from '../MapPins'
import { computeOverlayView, type OverlayFilter } from '../mapOverlayFilter'
import { useGetPlacesQuery } from '../placesApi'
import styles from './MapPage.module.css'

export function MapPage() {
  const [openPlaceId, setOpenPlaceId] = useState<string | null>(null)
  const [isSearchOpen, setSearchOpen] = useState(false)
  const [isPickerOpen, setPickerOpen] = useState(false)
  const [isNotificationsTeaserOpen, setNotificationsTeaserOpen] = useState(false)
  const [pendingCoords, setPendingCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [overlayFriendId, setOverlayFriendId] = useState<string | null>(null)
  const [overlayFilter, setOverlayFilter] = useState<OverlayFilter>('all')

  const { data: places, isLoading } = useGetPlacesQuery()
  const { data: friendPlaces } = useGetPersonPlacesQuery(overlayFriendId ?? '', { skip: !overlayFriendId })

  if (isLoading || !places) return <Loader />

  const view = overlayFriendId
    ? computeOverlayView(overlayFilter, places, friendPlaces ?? [])
    : { own: places, friend: [] }

  const layers: MapLayer[] = [
    { source: 'own', places: view.own.map((place) => ({ place })) },
    {
      source: 'friend',
      places: view.friend.map(({ place, shared }) => ({
        place,
        variant: shared ? ('shared' as const) : ('friend-only' as const),
      })),
    },
  ]

  function handleMapClick(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const leftPercent = ((event.clientX - rect.left) / rect.width) * 100
    const topPercent = ((event.clientY - rect.top) / rect.height) * 100
    setPendingCoords(projectFromPercent(topPercent, leftPercent))
  }

  return (
    <div className={styles.page} onClick={handleMapClick}>
      <div className={styles.basemap} />
      <div className={styles.gridLineH} style={{ top: '35%' }} />
      <div className={styles.gridLineV} style={{ left: '45%' }} />
      <div className={styles.gridLineH} style={{ top: '58%' }} />

      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>Ваша карта</div>
            <div className={styles.subtitle}>{places.length} мест на карте</div>
          </div>
          <div className={styles.headerActions} onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className={`${styles.iconButton} ${overlayFriendId ? styles.iconButtonActive : ''}`}
              aria-label="Сравнить карты"
              onClick={() => setPickerOpen(true)}
            >
              <span className="material-symbols-rounded">layers</span>
            </button>
            <button
              type="button"
              className={styles.iconButton}
              aria-label="Уведомления"
              onClick={() => setNotificationsTeaserOpen(true)}
            >
              <span className="material-symbols-rounded">notifications</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          className={styles.searchButton}
          onClick={(event) => {
            event.stopPropagation()
            setSearchOpen(true)
          }}
        >
          <span className="material-symbols-rounded">search</span>
          Искать места, воспоминания, настроения
        </button>
      </div>

      <MapPins layers={layers} selectedPlaceId={openPlaceId} onPinTap={(place) => setOpenPlaceId(place.id)} />

      {overlayFriendId && (
        <MapFriendOverlay
          friendId={overlayFriendId}
          ownPlaces={places}
          friendPlaces={friendPlaces ?? []}
          filter={overlayFilter}
          onFilterChange={setOverlayFilter}
          onClose={() => setOverlayFriendId(null)}
        />
      )}

      <BottomSheet open={!!pendingCoords} onClose={() => setPendingCoords(null)}>
        {pendingCoords && (
          <AddPlaceForm coords={pendingCoords} onSaved={() => setPendingCoords(null)} />
        )}
      </BottomSheet>

      {isSearchOpen && (
        <MapSearchSheet
          onClose={() => setSearchOpen(false)}
          onOpenPlace={(id) => {
            setOpenPlaceId(id)
            setSearchOpen(false)
          }}
        />
      )}

      {isPickerOpen && (
        <MapFriendPicker
          activeFriendId={overlayFriendId}
          onClose={() => setPickerOpen(false)}
          onSelect={(friendId) => {
            setOverlayFriendId(friendId)
            setOverlayFilter('all')
            setPickerOpen(false)
          }}
        />
      )}

      {openPlaceId && (
        <PlaceDetailView placeId={openPlaceId} onClose={() => setOpenPlaceId(null)} />
      )}

      {isNotificationsTeaserOpen && (
        <ComingSoon
          icon="notifications"
          title="Уведомления"
          description="Скоро здесь будут появляться напоминания и события от друзей. Мы дадим знать, когда это заработает."
          onClose={() => setNotificationsTeaserOpen(false)}
        />
      )}
    </div>
  )
}
