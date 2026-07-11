import { Avatar } from '../../shared/ui/Avatar'
import { EmptyState } from '../../shared/ui/EmptyState'
import { useSearchPeopleQuery } from '../people/peopleApi'
import styles from './MapFriendPicker.module.css'

interface MapFriendPickerProps {
  activeFriendId: string | null
  onClose: () => void
  onSelect: (friendId: string) => void
}

export function MapFriendPicker({ activeFriendId, onClose, onSelect }: MapFriendPickerProps) {
  const { data: people } = useSearchPeopleQuery('')
  const friends = (people ?? []).filter((person) => person.isFollowing)

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.handle} />
        <div className={styles.title}>Сравнить карты</div>
        <div className={styles.subtitle}>Выберите друга, чтобы увидеть общие места</div>

        {friends.length === 0 ? (
          <EmptyState icon="group" title="Пока не на кого подписаны" description="Подпишитесь на кого-нибудь в разделе «Люди»" />
        ) : (
          <div className={styles.list}>
            {friends.map((friend) => (
              <button
                key={friend.id}
                type="button"
                className={`${styles.row} ${activeFriendId === friend.id ? styles.rowActive : ''}`}
                onClick={() => onSelect(friend.id)}
              >
                <Avatar id={friend.id} name={friend.displayName} avatarUrl={friend.avatarUrl} size={40} />
                <span className={styles.rowName}>{friend.displayName}</span>
                {activeFriendId === friend.id && (
                  <span className={`material-symbols-rounded ${styles.checkIcon}`}>check_circle</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
