import { configureStore } from '@reduxjs/toolkit'
import { themeReducer } from '../features/theme/themeSlice'
import { authReducer } from '../features/auth/authSlice'
import { api } from './api'

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    auth: authReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
