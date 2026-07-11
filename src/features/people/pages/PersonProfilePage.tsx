import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Avatar } from '../../../shared/ui/Avatar'
import { ComingSoon } from '../../../shared/ui/ComingSoon'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { Loader } from '../../../shared/ui/Loader'
import { UnifiedPlaceCard } from '../../../shared/ui/UnifiedPlaceCard'
import { PlaceDetailView } from '../../places/PlaceDetailView'
import {
  useFollowMutation,
  useGetPersonPlacesQuery,
  useGetPersonQuery,
  useToggleCloseFriendMutation,
  useUnfollowMutation,
} from '../peopleApi'
import styles from './PersonProfilePage.module.css'

export function PersonProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [openPlaceId, setOpenPlaceId] = useState<string | null>(null)
  const [isCompareTeaserOpen, setCompareTeaserOpen] = useState(false)

  const { data: person, isLoading } = useGetPersonQuery(id!)
  const { data: places, isLoading: placesLoading } = useGetPersonPlacesQuery(id!)
  const [follow] = useFollowMutation()
  const [unfollow] = useUnfollowMutation()
  const [toggleCloseFriend] = useToggleCloseFriendMutation()

  if (isLoading || !person) return <Loader />

  return (
    <div>
      <button type="button" className={styles.backButton} onClick={() => navigate(-1)} aria-label="Назад">
        <span className="material-symbols-rounded">arrow_back</span>
      </button>

      <div className={styles.header}>
        <Avatar id={person.id} name={person.displayName} avatarUrl={person.avatarUrl} size={80} />
        <span className={styles.name}>{person.displayName}</span>
        {person.bio && <p className={styles.bio}>{person.bio}</p>}
        {person.trustSignal && <span className={styles.trustSignal}>{person.trustSignal}</span>}

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{person.followersCount}</span>
            <span className={styles.statLabel}>подписчиков</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{person.followingCount}</span>
            <span className={styles.statLabel}>подписок</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.followButton} ${person.isFollowing ? styles.following : styles.notFollowing}`}
            onClick={() => (person.isFollowing ? unfollow(person.id) : follow(person.id))}
          >
            {person.isFollowing ? 'Отписаться' : 'Подписаться'}
          </button>

          {person.isFollowing && (
            <button
              type="button"
              className={`${styles.closeFriendButton} ${person.isCloseFriend ? styles.active : ''}`}
              onClick={() =>
                toggleCloseFriend({ id: person.id, isCloseFriend: !person.isCloseFriend })
              }
            >
              <span
                className={`material-symbols-rounded ${person.isCloseFriend ? 'material-symbols-rounded--filled' : ''}`}
              >
                star
              </span>
              Близкий друг
            </button>
          )}
        </div>

        <button
          type="button"
          className={styles.compareButton}
          onClick={() => setCompareTeaserOpen(true)}
        >
          Сравнить карты
        </button>
      </div>

      <div className={styles.placesSection}>
        {placesLoading ? (
          <Loader />
        ) : !places || places.length === 0 ? (
          <EmptyState icon="explore" title="Пока нет публичных мест" />
        ) : (
          <div className={styles.list}>
            {places.map((place) => (
              <UnifiedPlaceCard key={place.id} place={place} onOpen={setOpenPlaceId} />
            ))}
          </div>
        )}
      </div>

      {openPlaceId && (
        <PlaceDetailView placeId={openPlaceId} onClose={() => setOpenPlaceId(null)} />
      )}

      {isCompareTeaserOpen && (
        <ComingSoon
          icon="compare"
          title="Сравнение карт"
          description="Скоро можно будет сравнить свою карту с картой друга и увидеть общие места. Мы дадим знать, когда это заработает."
          onClose={() => setCompareTeaserOpen(false)}
        />
      )}
    </div>
  )
}
