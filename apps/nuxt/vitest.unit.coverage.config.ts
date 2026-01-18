import { mergeConfig } from 'vitest/config'
import baseConfig from './vitest.unit.config'

export default mergeConfig(baseConfig, {
  test: {
    coverage: {
      enabled: true,
      all: false,
    },
  },
})
