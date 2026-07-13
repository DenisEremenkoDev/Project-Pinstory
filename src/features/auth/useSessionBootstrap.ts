import { useEffect, useState } from 'react'
import { useAppDispatch } from '../../app/hooks'
import { useRefreshMutation } from './authApi'
import { setAccessToken } from './authSlice'

interface SessionBootstrap {
  isBootstrapping: boolean
}

// Runs once on app load: silently tries to restore a session from the httpOnly
// refresh cookie so a page reload doesn't always land on /login. Failure is
// expected and silent (no session yet, or mock mode) — ProtectedRoute already
// redirects to /login when accessToken stays null.
export function useSessionBootstrap(): SessionBootstrap {
  const dispatch = useAppDispatch()
  const [refresh] = useRefreshMutation()
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  useEffect(() => {
    let cancelled = false

    refresh()
      .unwrap()
      .then((result) => {
        if (!cancelled) dispatch(setAccessToken(result.accessToken))
      })
      .catch(() => {
        // No valid refresh cookie — stay logged out.
      })
      .finally(() => {
        if (!cancelled) setIsBootstrapping(false)
      })

    return () => {
      cancelled = true
    }
  }, [dispatch, refresh])

  return { isBootstrapping }
}
