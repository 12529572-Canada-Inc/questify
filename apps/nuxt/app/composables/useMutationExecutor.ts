import type { ShowSnackbarOptions } from '~/composables/useSnackbar'
import { resolveApiError } from '~/utils/error'

export interface MutationMessages {
  success: string
  error: string
}

export interface MutationExecutorOptions {
  canMutate?: () => boolean
  refresh?: (() => Promise<void>) | (() => void)
  showSnackbar: (message: string, options?: ShowSnackbarOptions) => void
}

/**
 * Provides a mutation executor utility for handling asynchronous mutation requests with optional precondition checks,
 * automatic refresh, and user feedback via snackbars.
 *
 * @param options - Configuration options for the mutation executor, including mutation permission, refresh logic, and snackbar display.
 * @returns An object containing the `execute` function to perform the mutation.
 *
 * @template T - The type of the result returned by the mutation request.
 *
 * @example
 * const { execute } = useMutationExecutor({
 *   canMutate: () => true,
 *   refresh: async () => { ... },
 *   showSnackbar: (msg, opts) => { ... },
 * });
 * await execute(() => api.updateItem(data), { success: 'Updated!', error: 'Update failed.' });
 */
export function useMutationExecutor(options: MutationExecutorOptions) {
  async function execute<T>(
    request: () => Promise<T>,
    messages: MutationMessages,
  ): Promise<T | undefined> {
    if (options.canMutate && !options.canMutate()) {
      return undefined
    }

    try {
      const result = await request()
      await options.refresh?.()
      options.showSnackbar(messages.success, { variant: 'success' })
      return result
    }
    catch (err) {
      const message = resolveApiError(err, messages.error)
      options.showSnackbar(message, { variant: 'error' })
      throw err
    }
  }

  return {
    execute,
  }
}
