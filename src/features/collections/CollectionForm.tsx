import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Button, FormControlLabel, Stack, Switch, TextField, Typography } from '@mui/material'
import { getApiErrorMessage } from '../../shared/lib/getApiErrorMessage'
import type { Visibility } from '../../shared/lib/apiTypes'
import { useCreateCollectionMutation, useUpdateCollectionMutation } from './collectionsApi'
import { collectionSchema, type CollectionFormValues } from './collectionSchema'
import styles from './CollectionForm.module.css'

interface CollectionFormProps {
  collection?: { id: string; name: string; description: string | null; visibility: Visibility }
  onSaved: () => void
}

export function CollectionForm({ collection, onSaved }: CollectionFormProps) {
  const [createCollection, { isLoading: isCreating }] = useCreateCollectionMutation()
  const [updateCollection, { isLoading: isUpdating }] = useUpdateCollectionMutation()

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: collection?.name ?? '',
      description: collection?.description ?? '',
      visibility: collection?.visibility ?? 'public',
    },
  })

  async function onSubmit(values: CollectionFormValues) {
    try {
      const body = {
        name: values.name,
        description: values.description?.trim() || null,
        visibility: values.visibility,
      }
      if (collection) {
        await updateCollection({ id: collection.id, ...body }).unwrap()
      } else {
        await createCollection(body).unwrap()
      }
      onSaved()
    } catch (error) {
      setError('root', { message: getApiErrorMessage(error, 'Не удалось сохранить коллекцию') })
    }
  }

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} gap={2}>
      <Typography variant="h5" component="h2" className={styles.title}>
        {collection ? 'Изменить коллекцию' : 'Новая коллекция'}
      </Typography>

      <TextField
        label="Название"
        {...register('name')}
        error={!!errors.name}
        helperText={errors.name?.message}
      />

      <TextField label="Описание (необязательно)" multiline minRows={2} {...register('description')} />

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
            label={field.value === 'private' ? 'Приватная коллекция' : 'Публичная коллекция'}
          />
        )}
      />

      {errors.root && <Typography color="error">{errors.root.message}</Typography>}

      <Button type="submit" variant="contained" disabled={isCreating || isUpdating}>
        {isCreating || isUpdating ? 'Сохраняем…' : 'Сохранить'}
      </Button>
    </Stack>
  )
}
