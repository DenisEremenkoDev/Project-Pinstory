import { BrowserRouter } from 'react-router'
import { useTheme } from '../features/theme/useTheme'
import { AppRoutes } from './AppRoutes'

function App() {
  useTheme()

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
