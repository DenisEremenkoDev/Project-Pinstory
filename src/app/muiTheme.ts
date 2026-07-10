import { createTheme } from '@mui/material/styles'

// Mirrors the Pinstory design tokens in shared/ui/tokens.css. MUI is only
// used for standard form fields, so this theme intentionally doesn't
// include a CssBaseline — the rest of the app's look comes from tokens.css.
export const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#4F46E5',
      dark: '#4338CA',
    },
    error: {
      main: '#E11D48',
    },
    success: {
      main: '#16A34A',
    },
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
})
