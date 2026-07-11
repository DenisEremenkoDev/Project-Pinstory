import { MOOD_EMOJI, MOOD_LABELS, PLACE_STATUS_LABELS, type PlaceStatus } from '../../shared/lib/apiTypes'
import { formatLongRuDate } from '../../shared/lib/formatDate'
import { gradientForId } from '../../shared/lib/gradientPalette'
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

const STATUS_OPTIONS = Object.entries(PLACE_STATUS_LABELS) as [PlaceStatus, string][]

interface PlaceDetailViewProps {
  placeId: string
  onClose: () => void
}

export function PlaceDetailView({ placeId, onClose }: PlaceDetailViewProps) {
  const { data: place, isLoading } = useGetPlaceQuery(placeId)
  const [setFeedback] = useSetFeedbackMutation()
  const [clearFeedback] = useClearFeedbackMutation()
  const [deletePlace] = useDeletePlaceMutation()
  const [updatePlace] = useUpdatePlaceMutation()

  if (isLoading || !place) {
    return (
      <div className={styles.overlay}>
        <Loader />
      </div>
    )
  }

  function cycleFeedback() {
    if (place.myFeedback === null) setFeedback({ placeId, sentiment: 'like' })
    else if (place.myFeedback === 'like') setFeedback({ placeId, sentiment: 'dislike' })
    else clearFeedback(placeId)
  }

  function handleStatusTap(status: PlaceStatus) {
    updatePlace({ id: placeId, status })
  }

  function handleRatingTap(rating: number) {
    updatePlace({ id: placeId, rating })
  }

  async function handleDelete() {
    if (!window.confirm('Удалить это воспоминание?')) return
    await deletePlace(placeId)
    onClose()
  }

  const feedbackChip =
    place.myFeedback === 'like'
      ? { icon: 'favorite', label: 'Рекомендую', className: styles.like }
      : place.myFeedback === 'dislike'
        ? { icon: 'flag', label: 'Не рекомендую', className: styles.dislike }
        : { icon: 'favorite_border', label: 'Оценить впечатление', className: '' }

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
          <span className="material-symbols-rounded">location_on</span>
          {formatLongRuDate(place.createdAt)}
        </div>

        <span className={styles.title}>{place.name}</span>

        {place.isOwner && (
          <div className={styles.statusRow}>
            {STATUS_OPTIONS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`${styles.statusChip} ${place.status === value ? styles.statusChipActive : ''}`}
                onClick={() => handleStatusTap(value)}
              >
                {label}
              </button>
            ))}
          </div>
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

        <div className={styles.chipsRow}>
          {place.mood && (
            <span className={styles.moodChip}>
              {MOOD_EMOJI[place.mood]} {MOOD_LABELS[place.mood]}
            </span>
          )}
          <button
            type="button"
            className={`${styles.feedbackChip} ${feedbackChip.className}`}
            onClick={cycleFeedback}
          >
            <span
              className={`material-symbols-rounded ${place.myFeedback ? 'material-symbols-rounded--filled' : ''}`}
            >
              {feedbackChip.icon}
            </span>
            {feedbackChip.label}
          </button>
        </div>

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
      </div>
    </div>
  )
}
