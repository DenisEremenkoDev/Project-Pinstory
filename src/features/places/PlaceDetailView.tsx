import { useState } from 'react'
import { useNavigate } from 'react-router'
import { MOOD_EMOJI, MOOD_LABELS } from '../../shared/lib/apiTypes'
import { formatLongRuDate } from '../../shared/lib/formatDate'
import { gradientForId } from '../../shared/lib/gradientPalette'
import { ComingSoon } from '../../shared/ui/ComingSoon'
import { ErrorState } from '../../shared/ui/ErrorState'
import { Loader } from '../../shared/ui/Loader'
import { PlaceComments } from './PlaceComments'
import {
  useClearFeedbackMutation,
  useDeletePlaceMutation,
  useGetPlaceQuery,
  useSetFeedbackMutation,
  useUpdatePlaceMutation,
} from './placesApi'
import styles from './PlaceDetailView.module.css'

interface PlaceDetailViewProps {
  placeId: string
  onClose: () => void
}

export function PlaceDetailView({ placeId, onClose }: PlaceDetailViewProps) {
  const navigate = useNavigate()
  const [isRoutesTeaserOpen, setRoutesTeaserOpen] = useState(false)
  const { data: place, isLoading, isError, refetch } = useGetPlaceQuery(placeId)
  const [setFeedback] = useSetFeedbackMutation()
  const [clearFeedback] = useClearFeedbackMutation()
  const [deletePlace] = useDeletePlaceMutation()
  const [updatePlace] = useUpdatePlaceMutation()

  if (isLoading) {
    return (
      <div className={styles.overlay}>
        <Loader />
      </div>
    )
  }

  if (isError || !place) {
    return (
      <div className={styles.overlay}>
        <div className={styles.topBar}>
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Назад">
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
        </div>
        <ErrorState onRetry={refetch} />
      </div>
    )
  }

  // The place owner's single recommendation state — "Хочу посетить" (no
  // opinion yet) / "Рекомендую" / "Не рекомендую" (2026-07-16: replaces the
  // old three-way status chip row + separate feedback button; "Запланировано"
  // and "★ Любимое" as distinct display states are gone, myFeedback now
  // carries this for everyone, not just the owner — see decisions.md D4).
  // Only the owner may change it; the underlying `status` enum still exists
  // (set once at creation) but is no longer edited here.
  function cycleRecommendation() {
    if (place!.myFeedback === null) setFeedback({ placeId, sentiment: 'like' })
    else if (place!.myFeedback === 'like') setFeedback({ placeId, sentiment: 'dislike' })
    else clearFeedback(placeId)
  }

  function handleRatingTap(rating: number) {
    updatePlace({ id: placeId, rating })
  }

  async function handleDelete() {
    if (!window.confirm('Удалить это воспоминание?')) return
    await deletePlace(placeId)
    onClose()
  }

  const recommendationChip =
    place.myFeedback === 'like'
      ? { icon: 'favorite', label: 'Рекомендую', className: styles.like }
      : place.myFeedback === 'dislike'
        ? { icon: 'flag', label: 'Не рекомендую', className: styles.dislike }
        : { icon: 'explore', label: 'Хочу посетить', className: '' }

  return (
    <div className={styles.overlay}>
      <div
        className={styles.photo}
        style={place.photoUrl ? undefined : { background: gradientForId(place.id) }}
      >
        {place.photoUrl ? (
          <img src={place.photoUrl} alt={place.name} className={styles.photoImg} />
        ) : (
          <span className="material-symbols-rounded">image</span>
        )}

        <div className={styles.topBar}>
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Назад">
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          <div className={styles.topBarRight}>
            <button type="button" className={styles.iconButton} aria-label="Поделиться">
              <span className="material-symbols-rounded">ios_share</span>
            </button>
            {place.isOwner && (
              <button
                type="button"
                className={styles.iconButton}
                aria-label="Удалить"
                onClick={handleDelete}
              >
                <span className="material-symbols-rounded">delete</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.metaLine}>
          <button
            type="button"
            className={styles.locationButton}
            aria-label="Показать на карте"
            onClick={() => navigate('/map', { state: { focusPlaceId: placeId } })}
          >
            <span className="material-symbols-rounded">location_on</span>
          </button>
          {formatLongRuDate(place.createdAt)}
        </div>

        <span className={styles.title}>{place.name}</span>

        {place.isOwner ? (
          <button
            type="button"
            className={`${styles.recommendationChip} ${recommendationChip.className}`}
            onClick={cycleRecommendation}
          >
            <span
              className={`material-symbols-rounded ${place.myFeedback ? 'material-symbols-rounded--filled' : ''}`}
            >
              {recommendationChip.icon}
            </span>
            {recommendationChip.label}
          </button>
        ) : (
          <span className={`${styles.recommendationChip} ${styles.recommendationChipReadonly} ${recommendationChip.className}`}>
            <span
              className={`material-symbols-rounded ${place.myFeedback ? 'material-symbols-rounded--filled' : ''}`}
            >
              {recommendationChip.icon}
            </span>
            {recommendationChip.label}
          </span>
        )}

        <div className={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((star) =>
            place.isOwner ? (
              <button
                key={star}
                type="button"
                className={styles.starButton}
                aria-label={`Оценить на ${star}`}
                onClick={() => handleRatingTap(star)}
              >
                <span
                  className={`material-symbols-rounded ${star <= place.rating ? `material-symbols-rounded--filled ${styles.filled}` : ''}`}
                >
                  star
                </span>
              </button>
            ) : (
              <span
                key={star}
                className={`material-symbols-rounded ${star <= place.rating ? `material-symbols-rounded--filled ${styles.filled}` : ''}`}
              >
                star
              </span>
            ),
          )}
          <span className={styles.ratingLabel}>
            {place.rating > 0 ? place.rating.toFixed(1) : 'Оцените место'}
          </span>
        </div>

        {place.note && <p className={styles.note}>«{place.note}»</p>}

        {place.mood && (
          <div className={styles.chipsRow}>
            <span className={styles.moodChip}>
              {MOOD_EMOJI[place.mood]} {MOOD_LABELS[place.mood]}
            </span>
          </div>
        )}

        <PlaceComments placeId={placeId} />

        {place.tags.length > 0 && (
          <div className={styles.tags}>
            {place.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        <button type="button" className={styles.routesTeaser} onClick={() => setRoutesTeaserOpen(true)}>
          <span>🚧</span>
          Маршруты с этим местом — скоро
        </button>
      </div>

      {isRoutesTeaserOpen && (
        <ComingSoon
          icon="route"
          title="Маршруты"
          description="Скоро можно будет собирать маршруты из своих мест и проходить их вместе с друзьями. Мы дадим знать, когда это заработает."
          onClose={() => setRoutesTeaserOpen(false)}
        />
      )}
    </div>
  )
}
