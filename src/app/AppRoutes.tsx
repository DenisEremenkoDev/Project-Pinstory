import { Navigate, Route, Routes } from 'react-router'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { CollectionsPage } from '../features/profile/pages/CollectionsPage'
import { ProfilePage } from '../features/profile/pages/ProfilePage'
import { FeedPage } from '../features/feed/pages/FeedPage'
import { PeopleListPage } from '../features/people/pages/PeopleListPage'
import { PersonProfilePage } from '../features/people/pages/PersonProfilePage'
import { MapPage } from '../features/places/pages/MapPage'
import { AppShell } from '../shared/ui/AppShell'

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <AppShell />
    </ProtectedRoute>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Navigate to="/map" replace />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/people" element={<PeopleListPage />} />
        <Route path="/people/:id" element={<PersonProfilePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/collections" element={<CollectionsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/map" replace />} />
    </Routes>
  )
}
