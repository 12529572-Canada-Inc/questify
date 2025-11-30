import { defineVuetifyConfiguration } from 'vuetify-nuxt-module/custom-configuration'

export default defineVuetifyConfiguration({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          'primary': '#1e88e5',
          'on-primary': '#ffffff',
          'secondary': '#29b6f6',
          'on-secondary': '#082430',
          'background': '#f6f8fb',
          'on-background': '#1b2430',
          'surface': '#ffffff',
          'surface-variant': '#eef1f6',
          'on-surface': '#1b2430',
          'on-surface-variant': '#2a3342',
          'outline': '#d5dae4',
          'outline-variant': '#c3ccda',
          'success': '#2ecc71',
          'error': '#e53935',
          'info': '#0288d1',
          'warning': '#fbc02d',
        },
      },
      dark: {
        colors: {
          'primary': '#7dd3fc',
          'on-primary': '#062433',
          'secondary': '#5eead4',
          'on-secondary': '#06251c',
          'background': '#0b1017',
          'on-background': '#dfe6ef',
          'surface': '#141b24',
          'surface-variant': '#1d2633',
          'on-surface': '#e8edf5',
          'on-surface-variant': '#c8d1dc',
          'outline': '#273142',
          'outline-variant': '#333f55',
          'success': '#34d399',
          'error': '#f87171',
          'info': '#38bdf8',
          'warning': '#fbbf24',
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
  },
})
