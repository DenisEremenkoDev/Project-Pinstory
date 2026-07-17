import { useState } from 'react'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { getApiErrorMessage } from '../../../shared/lib/getApiErrorMessage'
import { Loader } from '../../../shared/ui/Loader'
import { PlaceDetailView } from '../../places/PlaceDetailView'
import { PlacesChronicle } from '../../places/PlacesChronicle'
import { FeedItemCard } from '../FeedItemCard'
import { useGetFeedQuery } from '../feedApi'
import styles from './FeedPage.module.css'

type FeedView = 'mine' | 'friends'

export function FeedPage() {
  const [view, setView] = useState<FeedView>('mine')
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [openPlaceId, setOpenPlaceId] = useState<string | null>(null)

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetFeedQuery({ cursor }, { skip: view !== 'friends' })

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Для вас</h1>

        <div className={styles.toggle}>
          <button
            type="button"
            className={`${styles.toggleButton} ${view === 'mine' ? styles.toggleButtonActive : ''}`}
            onClick={() => setView('mine')}
          >
            Мои воспоминания
          </button>
          <button
            type="button"
            className={`${styles.toggleButton} ${view === 'friends' ? styles.toggleButtonActive : ''}`}
            onClick={() => setView('friends')}
          >
            От друзей
          </button>
        </div>
      </div>

      {view === 'mine' ? (
        <PlacesChronicle onOpenPlace={setOpenPlaceId} />
      ) : isLoading ? (
        <Loader />
      ) : isError && !data ? (
        <ErrorState onRetry={refetch} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon="auto_awesome"
          title="Пока тихо"
          description="Здесь будут появляться новые места от тех, на кого вы подписаны"
        />
      ) : (
        <>
          <div className={styles.list}>
            {data.items.map((item) => (
              <FeedItemCard key={item.place.id} item={item} onOpenPlace={setOpenPlaceId} />
            ))}
          </div>

          {isError ? (
            <div className={styles.loadMoreError}>
              <span>{getApiErrorMessage(error, 'Не удалось загрузить ещё')}</span>
              <button type="button" onClick={refetch}>
                Повторить
              </button>
            </div>
          ) : (
            data.nextCursor && (
              <button
                type="button"
                className={styles.loadMore}
                disabled={isFetching}
                onClick={() => setCursor(data.nextCursor ?? undefined)}
              >
                {isFetching ? 'Загружаем…' : 'Показать ещё'}
              </button>
            )
          )}
        </>
      )}

      {openPlaceId && <PlaceDetailView placeId={openPlaceId} onClose={() => setOpenPlaceId(null)} />}
    </div>
  )
}
