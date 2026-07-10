import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { toggleTheme } from '../../theme/themeSlice'

export function ProfilePage() {
  const dispatch = useAppDispatch()
  const mode = useAppSelector((state) => state.theme.mode)

  return (
    <div>
      <h1>Профиль</h1>
      <button type="button" onClick={() => dispatch(toggleTheme())}>
        {mode === 'light' ? 'Тёмная тема' : 'Светлая тема'}
      </button>
    </div>
  )
}
