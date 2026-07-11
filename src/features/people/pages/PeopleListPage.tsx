import { useState } from 'react'
import { useNavigate } from 'react-router'
import { TextField } from '@mui/material'
import { Avatar } from '../../../shared/ui/Avatar'
import { Loader } from '../../../shared/ui/Loader'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { useFollowMutation, useSearchPeopleQuery } from '../peopleApi'
import styles from './PeopleListPage.module.css'

export function PeopleListPage() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { data: people, isLoading, isError, refetch } = useSearchPeopleQuery(query)
  const [follow] = useFollowMutation()

  if (isLoading) {
    return <Loader />
  }

  if (isError || !people) {
    return <ErrorState onRetry={refetch} />
  }

  if (query.trim()) {
    return (
      <div>
        <div className={styles.header}>
          <span className={styles.title}>Люди</span>
        </div>
        <div className={styles.searchWrap}>
          <TextField
            fullWidth
            placeholder="Найти человека"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {people.length === 0 ? (
          <EmptyState icon="person_search" title="Никого не нашли" />
        ) : (
          <div className={styles.section}>
            <div className={styles.list}>
              {people.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  className={styles.row}
                  onClick={() => navigate(`/people/${person.id}`)}
                >
                  <Avatar id={person.id} name={person.displayName} avatarUrl={person.avatarUrl} />
                  <div className={styles.rowBody}>
                    <div className={styles.rowName}>{person.displayName}</div>
                    {person.trustSignal && (
                      <div className={styles.trustSignal}>{person.trustSignal}</div>
                    )}
                  </div>
                  <span className={`material-symbols-rounded ${styles.chevron}`}>chevron_right</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const followed = people.filter((person) => person.isFollowing)
  const recommended = people.filter((person) => !person.isFollowing)

  return (
    <div>
      <div className={styles.header}>
        <span className={styles.title}>Люди</span>
        <div className={styles.subtitle}>Открывайте мир через тех, кому доверяете</div>
      </div>

      <div className={styles.searchWrap}>
        <TextField
          fullWidth
          placeholder="Найти человека"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className={styles.section}>
        <div className={styles.list}>
          {followed.map((person) => (
            <button
              key={person.id}
              type="button"
              className={styles.row}
              onClick={() => navigate(`/people/${person.id}`)}
            >
              <Avatar id={person.id} name={person.displayName} avatarUrl={person.avatarUrl} />
              <div className={styles.rowBody}>
                <div className={styles.rowName}>
                  {person.displayName}
                  {person.isCloseFriend && (
                    <span className="material-symbols-rounded material-symbols-rounded--filled">
                      star
                    </span>
                  )}
                </div>
                {person.trustSignal && (
                  <div className={styles.trustSignal}>{person.trustSignal}</div>
                )}
              </div>
              <span className={`material-symbols-rounded ${styles.chevron}`}>chevron_right</span>
            </button>
          ))}
        </div>
      </div>

      {recommended.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Вам может понравиться</div>
          <div className={styles.list}>
            {recommended.map((person) => (
              <div key={person.id} className={styles.row}>
                <Avatar id={person.id} name={person.displayName} avatarUrl={person.avatarUrl} />
                <div className={styles.rowBody}>
                  <div className={styles.rowName}>{person.displayName}</div>
                  {person.trustSignal && (
                    <div className={styles.trustSignal}>{person.trustSignal}</div>
                  )}
                </div>
                <button
                  type="button"
                  className={styles.followButton}
                  onClick={() => follow(person.id)}
                >
                  Подписаться
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
