import { useEffect, useState } from 'react'
import { Loader } from '../../shared/ui/Loader'
import { EmptyState } from '../../shared/ui/EmptyState'
import { ErrorState } from '../../shared/ui/ErrorState'
import type { GeocodeResultDto } from '../../shared/lib/apiTypes'
import { useGeocodeSearchQuery } from './placesApi'
import styles from './LocationSearchSheet.module.css'

interface LocationSearchSheetProps {
  onClose: () => void
  onSelect: (result: GeocodeResultDto) => void
}

const DEBOUNCE_MS = 400
const MIN_QUERY_LENGTH = 3

export function LocationSearchSheet({ onClose, onSelect }: LocationSearchSheetProps) {
  const [inputValue, setInputValue] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(inputValue.trim()), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [inputValue])

  const {
    data: results,
    isFetching,
    isError,
    refetch,
  } = useGeocodeSearchQuery(debouncedQuery, { skip: debouncedQuery.length < MIN_QUERY_LENGTH })

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <button type="button" className={styles.backButton} onClick={onClose} aria-label="Назад">
          <span className="material-symbols-rounded">arrow_back</span>
        </button>
        <div className={styles.inputWrap}>
          <span className="material-symbols-rounded">search</span>
          <input
            autoFocus
            className={styles.input}
            placeholder="Введите адрес или название места"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
          />
        </div>
      </div>

      {debouncedQuery.length < MIN_QUERY_LENGTH && (
        <p className={styles.hint}>Введите минимум {MIN_QUERY_LENGTH} символа</p>
      )}

      {debouncedQuery.length >= MIN_QUERY_LENGTH && isFetching && <Loader />}

      {debouncedQuery.length >= MIN_QUERY_LENGTH && !isFetching && isError && (
        <ErrorState
          title="Не удалось найти адрес"
          description="Проверьте соединение и попробуйте ещё раз"
          onRetry={refetch}
        />
      )}

      {debouncedQuery.length >= MIN_QUERY_LENGTH && !isFetching && !isError && results?.length === 0 && (
        <EmptyState icon="location_off" title="Ничего не найдено" description="Попробуйте изменить запрос" />
      )}

      {!isFetching && !isError && results && results.length > 0 && (
        <>
          <span className={styles.sectionLabel}>Адреса</span>
          <div className={styles.results}>
            {results.map((result, index) => (
              <button
                key={`${result.latitude}-${result.longitude}-${index}`}
                type="button"
                className={styles.result}
                onClick={() => {
                  onSelect(result)
                  onClose()
                }}
              >
                <span className="material-symbols-rounded">location_on</span>
                <div>
                  <div className={styles.resultName}>{result.name}</div>
                  <div className={styles.resultSub}>{result.address}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
