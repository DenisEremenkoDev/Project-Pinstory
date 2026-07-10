import { useState } from 'react'
import { Outlet } from 'react-router'
import { AddPlaceForm } from '../../features/places/AddPlaceForm'
import { BottomNav } from './BottomNav'
import { BottomSheet } from './BottomSheet'
import styles from './AppShell.module.css'

export function AppShell() {
  const [isAddPlaceOpen, setAddPlaceOpen] = useState(false)

  return (
    <>
      <main className={styles.content}>
        <Outlet />
      </main>
      <BottomNav onAddPlace={() => setAddPlaceOpen(true)} />
      <BottomSheet open={isAddPlaceOpen} onClose={() => setAddPlaceOpen(false)}>
        <AddPlaceForm onSaved={() => setAddPlaceOpen(false)} />
      </BottomSheet>
    </>
  )
}
