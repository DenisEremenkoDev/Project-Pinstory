import { Button } from '@mui/material'
import styles from './ComingSoon.module.css'

interface ComingSoonProps {
  icon: string
  title: string
  description: string
  onClose: () => void
}

export function ComingSoon({ icon, title, description, onClose }: ComingSoonProps) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} onClick={(event) => event.stopPropagation()}>
        <span className="material-symbols-rounded">{icon}</span>
        <span className={styles.title}>{title}</span>
        <span className={styles.description}>{description}</span>
        <Button variant="outlined" onClick={onClose}>
          Уведомить о запуске
        </Button>
      </div>
    </div>
  )
}
