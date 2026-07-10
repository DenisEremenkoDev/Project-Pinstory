import { useTheme } from '../features/theme/useTheme'

function App() {
  const { mode, toggle } = useTheme()

  return (
    <>
      <h1>Pinstory</h1>
      <button type="button" onClick={toggle}>
        {mode === 'light' ? 'Тёмная тема' : 'Светлая тема'}
      </button>
    </>
  )
}

export default App
