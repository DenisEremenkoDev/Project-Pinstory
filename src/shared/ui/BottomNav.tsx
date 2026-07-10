import { NavLink } from 'react-router'
import styles from './BottomNav.module.css'

interface NavTab {
  to: string
  label: string
  icon: string
}

const tabs: NavTab[] = [
  { to: '/map', label: 'Карта', icon: 'map' },
  { to: '/feed', label: 'Для вас', icon: 'explore' },
]

const tabsAfterAdd: NavTab[] = [
  { to: '/people', label: 'Люди', icon: 'group' },
  { to: '/profile', label: 'Профиль', icon: 'person' },
]

function handleAddPlace() {
  // TODO: open the "add place" bottom sheet once the places feature is implemented
}

export function BottomNav() {
  return (
    <nav className={styles.nav}>
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}
        >
          {({ isActive }) => (
            <>
              <span
                className={`material-symbols-rounded ${isActive ? 'material-symbols-rounded--filled' : ''}`}
              >
                {tab.icon}
              </span>
              <span className={styles.label}>{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}

      <div className={styles.addTab}>
        <button
          type="button"
          className={styles.addButton}
          onClick={handleAddPlace}
          aria-label="Добавить место"
        >
          <span className="material-symbols-rounded">add</span>
        </button>
      </div>

      {tabsAfterAdd.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}
        >
          {({ isActive }) => (
            <>
              <span
                className={`material-symbols-rounded ${isActive ? 'material-symbols-rounded--filled' : ''}`}
              >
                {tab.icon}
              </span>
              <span className={styles.label}>{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
