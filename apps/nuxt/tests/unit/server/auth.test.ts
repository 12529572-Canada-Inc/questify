import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authorize } from '../../../server/utils/auth'

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('$fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('authorize', () => {
  it('delegates to the login endpoint and returns the user', async () => {
    fetchMock.mockResolvedValue({ id: 'user-1' })

    const user = await authorize({ email: 'person@example.com', password: 'pw' })

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'person@example.com',
        password: 'pw',
      },
    })
    expect(user).toEqual({ id: 'user-1' })
  })

  it('returns null when the request yields no user', async () => {
    fetchMock.mockResolvedValue(undefined)

    expect(await authorize({ email: 'person@example.com', password: 'pw' })).toBeNull()
  })
})
