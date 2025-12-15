import { describe, expect, it } from 'vitest'
import {
  ADMIN_ROLE_NAME,
  DEFAULT_PRIVILEGE_KEYS,
  PRIVILEGE_DEFINITIONS,
  ROLE_DEFINITIONS,
  SUPER_ADMIN_ROLE_NAME,
  SUPPORT_ROLE_NAME,
} from '../src/permissions'

describe('permissions', () => {
  it('exposes stable privilege definitions and default keys', () => {
    expect(DEFAULT_PRIVILEGE_KEYS).toEqual(PRIVILEGE_DEFINITIONS.map(def => def.key))
    expect(new Set(DEFAULT_PRIVILEGE_KEYS).size).toBe(PRIVILEGE_DEFINITIONS.length)
  })

  it('includes predefined roles with expected privileges', () => {
    const byName = Object.fromEntries(ROLE_DEFINITIONS.map(role => [role.name, role]))

    expect(byName[SUPER_ADMIN_ROLE_NAME]?.privileges).toEqual(DEFAULT_PRIVILEGE_KEYS)
    expect(byName[ADMIN_ROLE_NAME]?.privileges).toContain('user:create')
    expect(byName[SUPPORT_ROLE_NAME]?.privileges).not.toContain('user:create')
    expect(byName[SUPPORT_ROLE_NAME]?.system).toBe(false)
  })
})
