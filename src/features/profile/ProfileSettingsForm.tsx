import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Button, FormControlLabel, Stack, Switch, TextField, Typography } from '@mui/material'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { toggleTheme } from '../theme/themeSlice'
import { clearAccessToken } from '../auth/authSlice'
import { useLogoutMutation } from '../auth/authApi'
import { getApiErrorMessage } from '../../shared/lib/getApiErrorMessage'
import type { ProfileDto } from '../../shared/lib/apiTypes'
import { useUpdateProfileMutation } from './profileApi'
import { profileSettingsSchema, type ProfileSettingsFormValues } from './profileSettingsSchema'
import styles from './ProfileSettingsForm.module.css'

interface ProfileSettingsFormProps {
  user: ProfileDto['user']
  onClose: () => void
  onSaved: () => void
}

export function ProfileSettingsForm({ user, onClose, onSaved }: ProfileSettingsFormProps) {
  const dispatch = useAppDispatch()
  const themeMode = useAppSelector((state) => state.theme.mode)
  const [updateProfile, { isLoading }] = useUpdateProfileMutation()
  const [logout] = useLogoutMutation()

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<ProfileSettingsFormValues>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      displayName: user.displayName,
      avatarUrl: user.avatarUrl ?? '',
      bio: user.bio ?? '',
      status: user.status ?? '',
      defaultVisibility: user.defaultVisibility,
      notificationsEnabled: user.notificationsEnabled,
    },
  })

  async function onSubmit(values: ProfileSettingsFormValues) {
    try {
      await updateProfile({
        displayName: values.displayName,
        avatarUrl: values.avatarUrl?.trim() || null,
        bio: values.bio?.trim() || null,
        status: values.status?.trim() || null,
        defaultVisibility: values.defaultVisibility,
        notificationsEnabled: values.notificationsEnabled,
      }).unwrap()
      onSaved()
    } catch (error) {
      setError('root', { message: getApiErrorMessage(error, 'Не удалось сохранить настройки') })
    }
  }

  async function handleLogout() {
    await logout()
      .unwrap()
      .catch(() => undefined)
    dispatch(clearAccessToken())
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.topBar}>
        <button type="button" className={styles.backButton} onClick={onClose} aria-label="Назад">
          <span className="material-symbols-rounded">arrow_back</span>
        </button>
        <span className={styles.title}>Настройки</span>
      </div>

      <Stack component="form" onSubmit={handleSubmit(onSubmit)} gap={2} className={styles.content}>
        <Typography component="h3" className={styles.sectionTitle}>
          Профиль
        </Typography>

        <TextField
          label="Имя"
          {...register('displayName')}
          error={!!errors.displayName}
          helperText={errors.displayName?.message}
        />

        <TextField label="Ссылка на аватар" placeholder="https://…" {...register('avatarUrl')} />

        <TextField label="О себе" multiline minRows={2} {...register('bio')} />

        <TextField label="Статус" placeholder="Короткая строка под именем" {...register('status')} />

        <Typography component="h3" className={styles.sectionTitle}>
          Приватность
        </Typography>

        <Controller
          control={control}
          name="defaultVisibility"
          render={({ field }) => (
            <FormControlLabel
              control={
                <Switch
                  checked={field.value === 'private'}
                  onChange={(event) => field.onChange(event.target.checked ? 'private' : 'public')}
                />
              }
              label={
                field.value === 'private'
                  ? 'Новые места по умолчанию приватные'
                  : 'Новые места по умолчанию публичные'
              }
            />
          )}
        />

        <Typography component="h3" className={styles.sectionTitle}>
          Уведомления
        </Typography>

        <Controller
          control={control}
          name="notificationsEnabled"
          render={({ field }) => (
            <FormControlLabel
              control={<Switch checked={field.value} onChange={(event) => field.onChange(event.target.checked)} />}
              label="Уведомления на почту"
            />
          )}
        />

        <FormControlLabel
          control={<Switch checked={themeMode === 'dark'} onChange={() => dispatch(toggleTheme())} />}
          label="Тёмная тема"
        />

        {errors.root && <Typography color="error">{errors.root.message}</Typography>}

        <Button type="submit" variant="contained" disabled={isLoading}>
          {isLoading ? 'Сохраняем…' : 'Сохранить'}
        </Button>

        <Button type="button" variant="outlined" color="error" className={styles.logoutButton} onClick={handleLogout}>
          Выйти
        </Button>
      </Stack>
    </div>
  )
}
