import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSnackbar } from '~/composables/useSnackbar'

describe('useSnackbar', () => {
  beforeEach(() => {
    globalThis.__resetNuxtState?.()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('queues messages and cycles through them', () => {
    const snackbar = useSnackbar()

    snackbar.showSnackbar('First message', { variant: 'info' })
    expect(snackbar.current.value?.message).toBe('First message')
    expect(snackbar.visible.value).toBe(true)

    snackbar.showSnackbar('Second message', { variant: 'success' })
    expect(snackbar.current.value?.message).toBe('First message')

    snackbar.setVisible(false)
    vi.advanceTimersByTime(250)

    expect(snackbar.current.value?.message).toBe('Second message')
    expect(snackbar.visible.value).toBe(true)

    snackbar.dismissCurrent()
    vi.advanceTimersByTime(250)

    expect(snackbar.current.value).toBeNull()
    expect(snackbar.visible.value).toBe(false)
  })

  it('ignores empty messages', () => {
    const snackbar = useSnackbar()

    snackbar.showSnackbar('   ', { variant: 'info' })
    expect(snackbar.current.value).toBeNull()
    expect(snackbar.visible.value).toBe(false)
  })
})
