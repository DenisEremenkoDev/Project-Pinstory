import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { Button, Stack, TextField, Typography } from '@mui/material'
import { getApiErrorMessage } from '../../../shared/lib/getApiErrorMessage'
import { useRegisterMutation } from '../authApi'
import { registerSchema, type RegisterFormValues } from '../authSchemas'

export function RegisterPage() {
  const navigate = useNavigate()
  const [registerUser, { isLoading }] = useRegisterMutation()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(values: RegisterFormValues) {
    try {
      await registerUser(values).unwrap()
      navigate('/login', { state: { justRegistered: true } })
    } catch (error) {
      setError('root', { message: getApiErrorMessage(error, 'Не удалось зарегистрироваться') })
    }
  }

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} gap={2} sx={{ p: 3, maxWidth: 360 }}>
      <Typography variant="h4" component="h1">
        Регистрация
      </Typography>

      <TextField
        label="Имя"
        autoComplete="name"
        {...register('displayName')}
        error={!!errors.displayName}
        helperText={errors.displayName?.message}
      />
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        {...register('email')}
        error={!!errors.email}
        helperText={errors.email?.message}
      />
      <TextField
        label="Пароль"
        type="password"
        autoComplete="new-password"
        {...register('password')}
        error={!!errors.password}
        helperText={errors.password?.message}
      />

      {errors.root && <Typography color="error">{errors.root.message}</Typography>}

      <Button type="submit" variant="contained" disabled={isLoading}>
        {isLoading ? 'Создаём аккаунт…' : 'Зарегистрироваться'}
      </Button>

      <Typography variant="body2">
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </Typography>
    </Stack>
  )
}
