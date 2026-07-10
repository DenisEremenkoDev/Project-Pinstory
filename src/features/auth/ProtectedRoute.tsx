import type { ReactElement } from 'react'
import { Navigate } from 'react-router'
import { useAppSelector } from '../../app/hooks'

interface ProtectedRouteProps {
  children: ReactElement
}

export function ProtectedRoute({ children }: ProtectedRouteProps): ReactElement {
  const accessToken = useAppSelector((state) => state.auth.accessToken)

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  return children
}
