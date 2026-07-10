import { Outlet } from 'react-router'
import { BottomNav } from './BottomNav'
import styles from './AppShell.module.css'

export function AppShell() {
  return (
    <>
      <main className={styles.content}>
        <Outlet />
      </main>
      <BottomNav />
    </>
  )
}
