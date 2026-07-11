import styles from './Avatar.module.css'

const PALETTE = ['#8B7CF6', '#14B8A6', '#F59E0B', '#F472B6', '#84A98C', '#60A5FA']

function colorForId(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]!
}

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
    <div className={styles.avatar} style={{ ...style, background: colorForId(id) }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
