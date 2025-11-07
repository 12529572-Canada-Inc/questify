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
