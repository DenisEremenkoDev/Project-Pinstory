import { useState } from 'react'
import { Link } from 'react-router'
import { Avatar } from '../../../shared/ui/Avatar'
import { BottomSheet } from '../../../shared/ui/BottomSheet'
import { ComingSoon } from '../../../shared/ui/ComingSoon'
import { Loader } from '../../../shared/ui/Loader'
import { useGetCollectionsQuery } from '../../collections/collectionsApi'
import { useGetProfileQuery } from '../profileApi'
import { ProfileSettingsForm } from '../ProfileSettingsForm'
import styles from './ProfilePage.module.css'

export function ProfilePage() {
  const [isSettingsOpen, setSettingsOpen] = useState(false)
  const [isRoutesTeaserOpen, setRoutesTeaserOpen] = useState(false)

  const { data: profile, isLoading } = useGetProfileQuery()
  const { data: collections } = useGetCollectionsQuery()

  if (isLoading || !profile) return <Loader />

  const { user } = profile
  const previewCollections = (collections?.own ?? []).slice(0, 3)

  return (
    <div>
      <button
        type="button"
        className={styles.settingsButton}
        aria-label="Настройки"
        onClick={() => setSettingsOpen(true)}
      >
        <span className="material-symbols-rounded">settings</span>
      </button>

      <div className={styles.header}>
        <Avatar id={user.id} name={user.displayName} avatarUrl={user.avatarUrl} size={80} />
        <span className={styles.name}>{user.displayName}</span>
        {user.status && <span className={styles.status}>{user.status}</span>}
        {user.bio && <p className={styles.bio}>{user.bio}</p>}

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{profile.placesCount}</span>
            <span className={styles.statLabel}>мест</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{profile.followersCount}</span>
            <span className={styles.statLabel}>подписчиков</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{profile.followingCount}</span>
            <span className={styles.statLabel}>подписок</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Коллекции</span>
          <Link to="/profile/collections" className={styles.sectionLink}>
            Все
          </Link>
        </div>

        {previewCollections.length === 0 ? (
          <Link to="/profile/collections" className={styles.emptyCollections}>
            <span className="material-symbols-rounded">bookmark_add</span>
            Создать первую коллекцию
          </Link>
        ) : (
          <div className={styles.collectionsRow}>
            {previewCollections.map((collection) => (
              <Link key={collection.id} to="/profile/collections" className={styles.collectionCard}>
                <span className="material-symbols-rounded">bookmarks</span>
                <span className={styles.collectionName}>{collection.name}</span>
                <span className={styles.collectionCount}>{collection.placesCount} мест</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <button type="button" className={styles.routesTeaser} onClick={() => setRoutesTeaserOpen(true)}>
        🚧 Маршруты — скоро
      </button>

      <BottomSheet open={isSettingsOpen} onClose={() => setSettingsOpen(false)}>
        <ProfileSettingsForm user={user} onSaved={() => setSettingsOpen(false)} />
      </BottomSheet>

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
