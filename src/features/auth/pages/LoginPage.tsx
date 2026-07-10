import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'
import { Button, Stack, TextField, Typography } from '@mui/material'
import { useAppDispatch } from '../../../app/hooks'
import { getApiErrorMessage } from '../../../shared/lib/getApiErrorMessage'
import { useLoginMutation } from '../authApi'
import { loginSchema, type LoginFormValues } from '../authSchemas'
import { setAccessToken } from '../authSlice'

export function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const justRegistered = (location.state as { justRegistered?: boolean } | null)?.justRegistered
  const [login, { isLoading }] = useLoginMutation()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginFormValues) {
    try {
      const result = await login(values).unwrap()
      dispatch(setAccessToken(result.accessToken))
      navigate('/map')
    } catch (error) {
      setError('root', { message: getApiErrorMessage(error, 'Неверный email или пароль') })
    }
  }

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} gap={2} sx={{ p: 3, maxWidth: 360 }}>
      <Typography variant="h4" component="h1">
        Вход
      </Typography>

      {justRegistered && (
        <Typography color="success.main">Аккаунт создан, теперь войдите</Typography>
      )}

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
        autoComplete="current-password"
        {...register('password')}
        error={!!errors.password}
        helperText={errors.password?.message}
      />

      {errors.root && <Typography color="error">{errors.root.message}</Typography>}

      <Button type="submit" variant="contained" disabled={isLoading}>
        {isLoading ? 'Входим…' : 'Войти'}
      </Button>

      <Typography variant="body2">
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </Typography>
    </Stack>
  )
}
