import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'pinstory-theme'

function getPreferredTheme(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return 'light'
}

interface ThemeState {
  mode: ThemeMode
}

const initialState: ThemeState = {
  mode: getPreferredTheme(),
}

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload
      localStorage.setItem(THEME_STORAGE_KEY, action.payload)
    },
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light'
      localStorage.setItem(THEME_STORAGE_KEY, state.mode)
    },
  },
})

export const { setTheme, toggleTheme } = themeSlice.actions
export const themeReducer = themeSlice.reducer
