import { useNavigate } from 'react-router'
import { useAppDispatch } from '../../../app/hooks'
import { setAccessToken } from '../authSlice'

export function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  // TODO: replace with a real RHF + Zod form wired to POST /auth/login
  function handleStubLogin() {
    dispatch(setAccessToken('stub-token'))
    navigate('/map')
  }

  return (
    <div>
      <h1>Вход</h1>
      <p>Форма входа появится на шаге auth-фичи.</p>
      <button type="button" onClick={handleStubLogin}>
        Войти (заглушка)
      </button>
    </div>
  )
}
