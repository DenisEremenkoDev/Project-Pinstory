import { EmptyState } from '../../shared/ui/EmptyState'
import { Loader } from '../../shared/ui/Loader'
import type { OwnCollectionDto } from '../../shared/lib/apiTypes'
import { useGetPlacesQuery } from '../places/placesApi'
import { useAddPlaceToCollectionMutation, useRemovePlaceFromCollectionMutation } from './collectionsApi'
import styles from './ManageCollectionPlaces.module.css'

interface ManageCollectionPlacesProps {
  collection: OwnCollectionDto
}

export function ManageCollectionPlaces({ collection }: ManageCollectionPlacesProps) {
  const { data: ownPlaces, isLoading } = useGetPlacesQuery()
  const [addPlace, { isLoading: isAdding }] = useAddPlaceToCollectionMutation()
  const [removePlace, { isLoading: isRemoving }] = useRemovePlaceFromCollectionMutation()

  const includedIds = new Set(collection.places.map((place) => place.id))
  const availablePlaces = (ownPlaces ?? []).filter((place) => !includedIds.has(place.id))

  return (
    <div>
      <span className={styles.title}>{collection.name}</span>

      <span className={styles.sectionLabel}>В коллекции</span>
      {collection.places.length === 0 ? (
        <EmptyState icon="bookmark" title="Пока нет мест" description="Добавьте место из списка ниже" />
      ) : (
        <div className={styles.list}>
          {collection.places.map((place) => (
            <div key={place.id} className={styles.row}>
              <span className={styles.rowName}>{place.name}</span>
              <button
                type="button"
                className={styles.rowAction}
                disabled={isRemoving}
                aria-label="Убрать из коллекции"
                onClick={() => removePlace({ collectionId: collection.id, placeId: place.id })}
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
          ))}
        </div>
      )}

      <span className={styles.sectionLabel}>Добавить место</span>
      {isLoading ? (
        <Loader />
      ) : availablePlaces.length === 0 ? (
        <EmptyState icon="explore" title="Все ваши места уже здесь" />
      ) : (
        <div className={styles.list}>
          {availablePlaces.map((place) => (
            <div key={place.id} className={styles.row}>
              <span className={styles.rowName}>{place.name}</span>
              <button
                type="button"
                className={styles.rowAction}
                disabled={isAdding}
                aria-label="Добавить в коллекцию"
                onClick={() => addPlace({ collectionId: collection.id, placeId: place.id })}
              >
                <span className="material-symbols-rounded">add</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
