import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Avatar } from '../../../shared/ui/Avatar'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { ErrorState } from '../../../shared/ui/ErrorState'
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

  const { data: person, isLoading, isError, refetch } = useGetPersonQuery(id!)
  const {
    data: places,
    isLoading: placesLoading,
    isError: placesError,
    refetch: refetchPlaces,
  } = useGetPersonPlacesQuery(id!)
  const [follow] = useFollowMutation()
  const [unfollow] = useUnfollowMutation()
  const [toggleCloseFriend] = useToggleCloseFriendMutation()

  if (isLoading) return <Loader />
  if (isError || !person) return <ErrorState onRetry={refetch} />

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
      </div>

      <div className={styles.placesSection}>
        {placesLoading ? (
          <Loader />
        ) : placesError ? (
          <ErrorState onRetry={refetchPlaces} />
        ) : !places || places.length === 0 ? (
          <EmptyState icon="explore" title="Пока нет публичных мест" />
        ) : (
          <div className={styles.list}>
            {places.map((place) => (
              <UnifiedPlaceCard
                key={place.id}
                place={place}
                onOpen={setOpenPlaceId}
                onOpenOnMap={() => navigate('/map', { state: { focusPlaceId: place.id } })}
              />
            ))}
          </div>
        )}
      </div>

      {openPlaceId && <PlaceDetailView placeId={openPlaceId} onClose={() => setOpenPlaceId(null)} />}
    </div>
  )
}
