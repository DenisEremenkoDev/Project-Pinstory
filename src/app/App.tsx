import { ThemeProvider } from '@mui/material/styles'
import { BrowserRouter } from 'react-router'
import { useTheme } from '../features/theme/useTheme'
import { AppRoutes } from './AppRoutes'
import { muiTheme } from './muiTheme'

function App() {
  useTheme()

  return (
    <ThemeProvider theme={muiTheme}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
