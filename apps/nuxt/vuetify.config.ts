import { defineVuetifyConfiguration } from 'vuetify-nuxt-module/custom-configuration'

// Read theme cookie during initialization
function getInitialTheme() {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    // On server or during build, always return light
    return 'light'
  }

  // On client, read from cookie
  try {
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'questify-theme') {
        const themePreference = value as 'light' | 'dark' | 'auto'
        if (themePreference === 'auto') {
          const hour = new Date().getHours()
          return (hour >= 19 || hour < 7) ? 'dark' : 'light'
        }
        return themePreference === 'dark' ? 'dark' : 'light'
      }
    }
  }
  catch (e) {
    console.error('Error reading theme cookie:', e)
  }
  return 'light'
}

export default defineVuetifyConfiguration({
  ssr: {
    clientWidth: 1280,
  },
  theme: {
    defaultTheme: getInitialTheme(),
    themes: {
      light: {
        colors: {
          primary: '#1976D2', // Blue bar background
          onPrimary: '#FFFFFF', // White text on bar
          background: '#FFFFFF',
          surface: '#FFFFFF',
        },
      },
      dark: {
        colors: {
          primary: '#FFFFFF', // White bar background
          onPrimary: '#1976D2', // Blue text on bar
          background: '#121212',
          surface: '#1E1E1E',
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
  },
})
