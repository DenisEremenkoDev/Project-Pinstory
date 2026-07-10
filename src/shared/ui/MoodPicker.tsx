import { MOOD_EMOJI, MOOD_LABELS, type Mood } from '../lib/apiTypes'
import styles from './MoodPicker.module.css'

const MOODS = Object.keys(MOOD_EMOJI) as Mood[]

interface MoodPickerProps {
  value: Mood | null
  onChange: (value: Mood | null) => void
}

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <div className={styles.moods}>
      {MOODS.map((mood) => (
        <button
          key={mood}
          type="button"
          className={`${styles.mood} ${value === mood ? styles.selected : ''}`}
          onClick={() => onChange(value === mood ? null : mood)}
          aria-label={MOOD_LABELS[mood]}
          title={MOOD_LABELS[mood]}
        >
          {MOOD_EMOJI[mood]}
        </button>
      ))}
    </div>
  )
}
