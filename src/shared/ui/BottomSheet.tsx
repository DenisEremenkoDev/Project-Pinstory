import type { ReactNode } from 'react'
import styles from './BottomSheet.module.css'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  if (!open) return null

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={(event) => event.stopPropagation()}>
        <div className={styles.handle} />
        {children}
      </div>
    </div>
  )
}
