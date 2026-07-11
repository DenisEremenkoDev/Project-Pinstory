import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Avatar } from '../../../shared/ui/Avatar'
import { BottomSheet } from '../../../shared/ui/BottomSheet'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { Loader } from '../../../shared/ui/Loader'
import { CollectionForm } from '../../collections/CollectionForm'
import { ManageCollectionPlaces } from '../../collections/ManageCollectionPlaces'
import { useDeleteCollectionMutation, useGetCollectionsQuery } from '../../collections/collectionsApi'
import styles from './CollectionsPage.module.css'

export function CollectionsPage() {
  const navigate = useNavigate()
  const { data: collections, isLoading, isError, refetch } = useGetCollectionsQuery()
  const [deleteCollection] = useDeleteCollectionMutation()

  const [isCreateOpen, setCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [managingId, setManagingId] = useState<string | null>(null)

  const editingCollection = collections?.own.find((collection) => collection.id === editingId) ?? null
  const managingCollection = collections?.own.find((collection) => collection.id === managingId) ?? null

  function handleDelete(id: string, name: string) {
    if (window.confirm(`Удалить коллекцию «${name}»?`)) deleteCollection(id)
  }

  return (
    <div>
      <button type="button" className={styles.backButton} onClick={() => navigate(-1)} aria-label="Назад">
        <span className="material-symbols-rounded">arrow_back</span>
      </button>

      <div className={styles.pageHeader}>
        <span className={styles.pageTitle}>Коллекции</span>
      </div>

      {isLoading ? (
        <Loader />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Мои коллекции</span>
              <button type="button" className={styles.createButton} onClick={() => setCreateOpen(true)}>
                <span className="material-symbols-rounded">add</span>
                Создать
              </button>
            </div>

            {!collections || collections.own.length === 0 ? (
              <EmptyState
                icon="bookmarks"
                title="Пока нет коллекций"
                description="Соберите места в подборку по настроению или маршруту"
              />
            ) : (
              <div className={styles.list}>
                {collections.own.map((collection) => (
                  <div key={collection.id} className={styles.ownCard}>
                    <button
                      type="button"
                      className={styles.ownCardBody}
                      onClick={() => setManagingId(collection.id)}
                    >
                      <span className="material-symbols-rounded">
                        {collection.visibility === 'private' ? 'lock' : 'bookmarks'}
                      </span>
                      <span className={styles.ownCardText}>
                        <span className={styles.ownCardName}>{collection.name}</span>
                        <span className={styles.ownCardMeta}>{collection.placesCount} мест</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className={styles.iconButton}
                      aria-label="Изменить коллекцию"
                      onClick={() => setEditingId(collection.id)}
                    >
                      <span className="material-symbols-rounded">edit</span>
                    </button>
                    <button
                      type="button"
                      className={styles.iconButton}
                      aria-label="Удалить коллекцию"
                      onClick={() => handleDelete(collection.id, collection.name)}
                    >
                      <span className="material-symbols-rounded">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.section}>
            <span className={styles.sectionTitle}>Коллекции друзей</span>

            {!collections || collections.following.length === 0 ? (
              <EmptyState
                icon="group"
                title="Пока нет коллекций от друзей"
                description="Здесь появятся публичные подборки людей, на которых вы подписаны"
              />
            ) : (
              <div className={styles.list}>
                {collections.following.map((collection) => (
                  <button
                    key={collection.id}
                    type="button"
                    className={styles.followedCard}
                    onClick={() => navigate(`/people/${collection.owner.id}`)}
                  >
                    <Avatar
                      id={collection.owner.id}
                      name={collection.owner.displayName}
                      avatarUrl={collection.owner.avatarUrl}
                      size={40}
                    />
                    <span className={styles.ownCardText}>
                      <span className={styles.ownCardName}>{collection.name}</span>
                      <span className={styles.ownCardMeta}>
                        {collection.owner.displayName} · {collection.placesCount} мест
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <BottomSheet open={isCreateOpen} onClose={() => setCreateOpen(false)}>
        <CollectionForm onSaved={() => setCreateOpen(false)} />
      </BottomSheet>

      <BottomSheet open={!!editingCollection} onClose={() => setEditingId(null)}>
        {editingCollection && <CollectionForm collection={editingCollection} onSaved={() => setEditingId(null)} />}
      </BottomSheet>

      <BottomSheet open={!!managingCollection} onClose={() => setManagingId(null)}>
        {managingCollection && <ManageCollectionPlaces collection={managingCollection} />}
      </BottomSheet>
    </div>
  )
}
