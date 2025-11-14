import { describe, expect, it, vi } from 'vitest'
import { useMutationExecutor } from '~/composables/useMutationExecutor'

describe('useMutationExecutor', () => {
  it('skips execution when canMutate returns false', async () => {
    const request = vi.fn()
    const refresh = vi.fn()
    const showSnackbar = vi.fn()

    const { execute } = useMutationExecutor({
      canMutate: () => false,
      refresh,
      showSnackbar,
    })

    const result = await execute(request, { success: 'ok', error: 'bad' })
    expect(result).toBeUndefined()
    expect(request).not.toHaveBeenCalled()
    expect(refresh).not.toHaveBeenCalled()
    expect(showSnackbar).not.toHaveBeenCalled()
  })

  it('executes the request, refreshes, and shows success toasts', async () => {
    const request = vi.fn().mockResolvedValue({ status: 200 })
    const refresh = vi.fn().mockResolvedValue(undefined)
    const showSnackbar = vi.fn()

    const { execute } = useMutationExecutor({
      canMutate: () => true,
      refresh,
      showSnackbar,
    })

    const result = await execute(request, {
      success: 'All good',
      error: 'Failed',
    })

    expect(result).toEqual({ status: 200 })
    expect(request).toHaveBeenCalledTimes(1)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(showSnackbar).toHaveBeenCalledWith('All good', { variant: 'success' })
  })

  it('surfaces errors through resolveApiError and rethrows', async () => {
    const error = {
      data: {
        statusMessage: 'Nope',
      },
    }
    const request = vi.fn().mockRejectedValue(error)
    const refresh = vi.fn()
    const showSnackbar = vi.fn()

    const { execute } = useMutationExecutor({
      canMutate: () => true,
      refresh,
      showSnackbar,
    })

    await expect(execute(request, {
      success: 'ok',
      error: 'Request failed',
    })).rejects.toBe(error)

    expect(refresh).not.toHaveBeenCalled()
    expect(showSnackbar).toHaveBeenCalledWith('Nope', { variant: 'error' })
  })
})
