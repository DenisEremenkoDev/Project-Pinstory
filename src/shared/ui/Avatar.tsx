import { gradientForId } from '../lib/gradientPalette'
import styles from './Avatar.module.css'

interface AvatarProps {
  id: string
  name: string
  avatarUrl?: string | null
  size?: number
}

export function Avatar({ id, name, avatarUrl, size = 48 }: AvatarProps) {
  const style = { width: size, height: size, fontSize: size * 0.4 }

  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className={styles.avatar} style={style} />
  }

  return (
    <div className={styles.avatar} style={{ ...style, background: gradientForId(id) }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
