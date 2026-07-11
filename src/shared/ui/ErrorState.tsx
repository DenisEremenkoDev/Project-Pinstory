import styles from './ErrorState.module.css'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
}

export function ErrorState({
  title = 'Не удалось загрузить',
  description = 'Проверьте соединение и попробуйте ещё раз',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className={styles.error}>
      <span className="material-symbols-rounded">error_outline</span>
      <span className={styles.title}>{title}</span>
      <span className={styles.description}>{description}</span>
      {onRetry && (
        <button type="button" className={styles.retryButton} onClick={onRetry}>
          Повторить
        </button>
      )}
    </div>
  )
}
