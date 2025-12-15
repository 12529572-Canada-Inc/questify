import { describe, expect, it } from 'vitest'
import { isThemePreference, THEME_PREFERENCES } from '../src/themes'

describe('themes', () => {
  it('validates known theme preferences', () => {
    for (const pref of THEME_PREFERENCES) {
      expect(isThemePreference(pref)).toBe(true)
    }
    expect(isThemePreference('unknown')).toBe(false)
    expect(isThemePreference(42)).toBe(false)
  })
})
