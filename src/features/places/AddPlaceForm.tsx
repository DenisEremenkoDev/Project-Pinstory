import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import {
  Button,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { StarRatingInput } from '../../shared/ui/StarRatingInput'
import { MoodPicker } from '../../shared/ui/MoodPicker'
import { getApiErrorMessage } from '../../shared/lib/getApiErrorMessage'
import { PLACE_STATUS_LABELS } from '../../shared/lib/apiTypes'
import { useCreatePlaceMutation } from './placesApi'
import { addPlaceSchema, type AddPlaceFormValues } from './addPlaceSchema'
import styles from './AddPlaceForm.module.css'

// Placeholder coordinates until the real Yandex Maps geosuggest/map-click
// flow is wired up (deliberately last in the build sequence).
const DEFAULT_COORDS = { latitude: 59.93, longitude: 30.35 }

const STATUS_OPTIONS = Object.entries(PLACE_STATUS_LABELS) as [AddPlaceFormValues['status'], string][]

interface AddPlaceFormProps {
  onSaved: () => void
}

export function AddPlaceForm({ onSaved }: AddPlaceFormProps) {
  const [createPlace, { isLoading }] = useCreatePlaceMutation()

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<AddPlaceFormValues>({
    resolver: zodResolver(addPlaceSchema),
    defaultValues: { rating: 0, status: 'want_to_visit', visibility: 'public', mood: undefined },
  })

  async function onSubmit(values: AddPlaceFormValues) {
    try {
      await createPlace({
        ...DEFAULT_COORDS,
        name: values.name,
        rating: values.rating,
        note: values.note?.trim() || null,
        tags: values.tags
          ? values.tags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
        status: values.status,
        visibility: values.visibility,
        mood: values.mood ?? null,
      }).unwrap()
      onSaved()
    } catch (error) {
      setError('root', { message: getApiErrorMessage(error, 'Не удалось сохранить место') })
    }
  }

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} gap={2}>
      <Typography variant="h5" component="h2" className={styles.title}>
        Новое воспоминание
      </Typography>

      <div className={styles.photoDropzone}>
        <span className="material-symbols-rounded">add_a_photo</span>
        <span>Добавить фото</span>
      </div>

      <button type="button" className={styles.locationField}>
        <span className="material-symbols-rounded">location_on</span>
        Где это было?
      </button>

      <TextField
        label="Название места"
        {...register('name')}
        error={!!errors.name}
        helperText={errors.name?.message}
      />

      <TextField
        placeholder="Что здесь произошло? Или просто каким было ощущение…"
        multiline
        minRows={2}
        {...register('note')}
      />

      <span className={styles.microLabel}>Оцените место</span>
      <Controller
        control={control}
        name="rating"
        render={({ field }) => <StarRatingInput value={field.value} onChange={field.onChange} />}
      />
      {errors.rating && <Typography color="error">{errors.rating.message}</Typography>}

      <span className={styles.microLabel}>Что вы почувствовали?</span>
      <Controller
        control={control}
        name="mood"
        render={({ field }) => (
          <MoodPicker value={field.value ?? null} onChange={(mood) => field.onChange(mood ?? undefined)} />
        )}
      />

      <TextField
        label="Теги через запятую (необязательно)"
        placeholder="кофе, уют"
        {...register('tags')}
      />

      <TextField label="Статус" select defaultValue="want_to_visit" {...register('status')}>
        {STATUS_OPTIONS.map(([value, label]) => (
          <MenuItem key={value} value={value}>
            {label}
          </MenuItem>
        ))}
      </TextField>

      <Controller
        control={control}
        name="visibility"
        render={({ field }) => (
          <FormControlLabel
            control={
              <Switch
                checked={field.value === 'private'}
                onChange={(event) => field.onChange(event.target.checked ? 'private' : 'public')}
              />
            }
            label={field.value === 'private' ? 'Приватное место' : 'Публичное место'}
          />
        )}
      />

      <Typography className={styles.mapNote}>
        📍 Выбор точки на карте появится позже — пока сохраняем в центре города.
      </Typography>

      {errors.root && <Typography color="error">{errors.root.message}</Typography>}

      <Button type="submit" variant="contained" disabled={isLoading}>
        {isLoading ? 'Сохраняем…' : 'Сохранить воспоминание'}
      </Button>
    </Stack>
  )
}
