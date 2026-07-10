import styles from './StarRatingInput.module.css'

interface StarRatingInputProps {
  value: number
  onChange: (value: number) => void
}

export function StarRatingInput({ value, onChange }: StarRatingInputProps) {
  return (
    <div className={styles.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`${styles.star} ${star <= value ? styles.filled : ''}`}
          onClick={() => onChange(star)}
          aria-label={`Оценка ${star} из 5`}
        >
          <span
            className={`material-symbols-rounded ${star <= value ? 'material-symbols-rounded--filled' : ''}`}
          >
            star
          </span>
        </button>
      ))}
    </div>
  )
}
