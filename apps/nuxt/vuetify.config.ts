import { defineVuetifyConfiguration } from 'vuetify-nuxt-module/custom-configuration'

export default defineVuetifyConfiguration({
  ssr: {
    clientWidth: 1280,
  },
  theme: {
    defaultTheme: 'light',
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
