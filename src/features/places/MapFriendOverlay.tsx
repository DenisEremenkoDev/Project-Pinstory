import { useState } from 'react'
import { Avatar } from '../../shared/ui/Avatar'
import { ComingSoon } from '../../shared/ui/ComingSoon'
import type { PlaceDto } from '../../shared/lib/apiTypes'
import { useGetPersonQuery } from '../people/peopleApi'
import { computeOverlayView, type OverlayFilter } from './mapOverlayFilter'
import styles from './MapFriendOverlay.module.css'

const FILTERS: { value: OverlayFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'common', label: 'Общие места' },
  { value: 'own_only', label: 'Только свои' },
  { value: 'friend_only', label: 'Только у друга' },
  { value: 'favorites', label: 'Избранные' },
  { value: 'common_want', label: 'Общие «хочу посетить»' },
]

interface MapFriendOverlayProps {
  friendId: string
  ownPlaces: PlaceDto[]
  friendPlaces: PlaceDto[]
  filter: OverlayFilter
  onFilterChange: (filter: OverlayFilter) => void
  onClose: () => void
}

// Legend + filter chips for the active friend map overlay. Pin rendering
// itself lives in MapPins (fed by the `layers` array built in MapPage), per
// CLAUDE.md's "map accepts pin layers, not a hardcoded list" rule.
export function MapFriendOverlay({
  friendId,
  ownPlaces,
  friendPlaces,
  filter,
  onFilterChange,
  onClose,
}: MapFriendOverlayProps) {
  const [isFullComparisonTeaserOpen, setFullComparisonTeaserOpen] = useState(false)
  const { data: friend } = useGetPersonQuery(friendId)
  const fullView = computeOverlayView('all', ownPlaces, friendPlaces)
  const sharedCount = fullView.friend.filter((pin) => pin.shared).length
  const friendOnlyCount = fullView.friend.filter((pin) => !pin.shared).length

  return (
    <>
      <div className={styles.legendWrap} onClick={(event) => event.stopPropagation()}>
        <div className={styles.legend}>
          {friend && (
            <Avatar id={friend.id} name={friend.displayName} avatarUrl={friend.avatarUrl} size={26} />
          )}
          <span className={styles.legendText}>
            {friend?.displayName.split(' ')[0]}: общих мест — {sharedCount}, новых для вас — {friendOnlyCount}
          </span>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Закрыть">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <div className={styles.filters}>
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`${styles.filterChip} ${filter === item.value ? styles.filterChipActive : ''}`}
              onClick={() => onFilterChange(item.value)}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            className={styles.filterChip}
            onClick={() => setFullComparisonTeaserOpen(true)}
          >
            🚧 Полное сравнение
          </button>
        </div>
      </div>

      {isFullComparisonTeaserOpen && (
        <ComingSoon
          icon="compare"
          title="Полное сравнение карт"
          description="Скоро здесь появится глубокая статистика: совместные визиты, история пересечений маршрутов. Мы дадим знать, когда это заработает."
          onClose={() => setFullComparisonTeaserOpen(false)}
        />
      )}
    </>
  )
}
