import { useState } from 'react'
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
import { PLACE_STATUS_LABELS, type GeocodeResultDto } from '../../shared/lib/apiTypes'
import { useCreatePlaceMutation } from './placesApi'
import { addPlaceSchema, type AddPlaceFormValues } from './addPlaceSchema'
import { LocationSearchSheet } from './LocationSearchSheet'
import styles from './AddPlaceForm.module.css'

// Placeholder coordinates until the real Yandex Maps geosuggest/map-click
// flow is wired up (deliberately last in the build sequence).
const DEFAULT_COORDS = { latitude: 59.93, longitude: 30.35 }

const STATUS_OPTIONS = Object.entries(PLACE_STATUS_LABELS) as [
  AddPlaceFormValues['status'],
  string,
][]

interface AddPlaceFormProps {
  onSaved: () => void
  coords?: { latitude: number; longitude: number }
}

export function AddPlaceForm({ onSaved, coords }: AddPlaceFormProps) {
  const [createPlace, { isLoading }] = useCreatePlaceMutation()
  const [isLocationSearchOpen, setLocationSearchOpen] = useState(false)
  const [searchedLocation, setSearchedLocation] = useState<GeocodeResultDto | null>(null)

  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    formState: { errors },
  } = useForm<AddPlaceFormValues>({
    resolver: zodResolver(addPlaceSchema),
    defaultValues: { rating: 0, status: 'want_to_visit', visibility: 'public', mood: undefined },
  })

  const resolvedCoords =
    coords ??
    (searchedLocation
      ? { latitude: searchedLocation.latitude, longitude: searchedLocation.longitude }
      : undefined)

  function handleLocationSelect(result: GeocodeResultDto) {
    setSearchedLocation(result)
    setValue('name', result.name)
  }

  async function onSubmit(values: AddPlaceFormValues) {
    try {
      await createPlace({
        ...(resolvedCoords ?? DEFAULT_COORDS),
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
    <>
      <Stack component="form" onSubmit={handleSubmit(onSubmit)} gap={2}>
        <Typography variant="h5" component="h2" className={styles.title}>
          Новое воспоминание
        </Typography>

        <div className={styles.photoDropzone}>
          <span className="material-symbols-rounded">add_a_photo</span>
          <span>Добавить фото</span>
        </div>

        <button
          type="button"
          className={styles.locationField}
          onClick={() => setLocationSearchOpen(true)}
          disabled={!!coords}
        >
          <span className="material-symbols-rounded">location_on</span>
          {coords
            ? 'Место выбрано на карте'
            : (searchedLocation?.name ?? 'Где это было? Нажмите, чтобы найти адрес')}
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
            <MoodPicker
              value={field.value ?? null}
              onChange={(mood) => field.onChange(mood ?? undefined)}
            />
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

        {!resolvedCoords && (
          <Typography className={styles.mapNote}>
            Найдите адрес выше или выберите точку на карте, иначе сохраним в центре города.
          </Typography>
        )}

        {errors.root && <Typography color="error">{errors.root.message}</Typography>}

        <Button type="submit" variant="contained" disabled={isLoading}>
          {isLoading ? 'Сохраняем…' : 'Сохранить воспоминание'}
        </Button>
      </Stack>

      {isLocationSearchOpen && (
        <LocationSearchSheet
          onClose={() => setLocationSearchOpen(false)}
          onSelect={handleLocationSelect}
        />
      )}
    </>
  )
}
