import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { toggleTheme, type ThemeMode } from './themeSlice'

export function useTheme(): { mode: ThemeMode; toggle: () => void } {
  const dispatch = useAppDispatch()
  const mode = useAppSelector((state) => state.theme.mode)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode)
  }, [mode])

  return { mode, toggle: () => dispatch(toggleTheme()) }
}
