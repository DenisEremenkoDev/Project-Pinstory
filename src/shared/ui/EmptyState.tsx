import styles from './EmptyState.module.css'

interface EmptyStateProps {
  icon: string
  title: string
  description?: string
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <span className="material-symbols-rounded">{icon}</span>
      <span className={styles.title}>{title}</span>
      {description && <span className={styles.description}>{description}</span>}
    </div>
  )
}
