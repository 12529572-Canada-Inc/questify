import { ref, unref, type MaybeRef } from 'vue'
import { useSnackbar } from './useSnackbar'
import { resolveApiError } from '~/utils/error'

type Awaitable<T> = T | Promise<T>

interface QuestLifecycleOptions {
  questId: MaybeRef<string | null | undefined>
  isOwner: MaybeRef<boolean>
  onArchived?: () => Awaitable<void>
  onDeleted?: () => Awaitable<void>
}

/**
 * Provides archive/delete handlers for quest owners, handling permission checks,
 * loading state, snackbar messaging, and optional callbacks when the actions complete.
 *
  * @param options.questId - Quest id (or ref) targeted by lifecycle actions.
  * @param options.isOwner - Reactive flag indicating whether current user owns the quest.
  * @param options.onArchived - Optional callback invoked after archiving succeeds.
  * @param options.onDeleted - Optional callback invoked after deletion succeeds.
 */
export function useQuestLifecycle(options: QuestLifecycleOptions) {
  const archiveLoading = ref(false)
  const deleteLoading = ref(false)
  const { showSnackbar } = useSnackbar()

  function resolveQuestId() {
    const questId = unref(options.questId)
    return typeof questId === 'string' && questId.length > 0 ? questId : null
  }

  async function archiveQuest() {
    if (!unref(options.isOwner) || archiveLoading.value) {
      return false
    }

    const questId = resolveQuestId()
    if (!questId) {
      return false
    }

    archiveLoading.value = true

    try {
      await $fetch(`/api/quests/${questId}/archive`, {
        method: 'PATCH',
      })
      await options.onArchived?.()
      showSnackbar('Quest archived successfully.', { variant: 'success' })
      return true
    }
    catch (error) {
      const message = resolveApiError(error, 'Unable to archive the quest. Please try again.')
      showSnackbar(message, { variant: 'error' })
      return false
    }
    finally {
      archiveLoading.value = false
    }
  }

  async function deleteQuest() {
    if (!unref(options.isOwner) || deleteLoading.value) {
      return false
    }

    const questId = resolveQuestId()
    if (!questId) {
      return false
    }

    deleteLoading.value = true

    try {
      await $fetch(`/api/quests/${questId}`, {
        method: 'DELETE',
      })
      await options.onDeleted?.()
      showSnackbar('Quest permanently deleted.', { variant: 'success' })
      return true
    }
    catch (error) {
      const message = resolveApiError(error, 'Unable to delete the quest. Please try again.')
      showSnackbar(message, { variant: 'error' })
      return false
    }
    finally {
      deleteLoading.value = false
    }
  }

  return {
    archiveQuest,
    deleteQuest,
    archiveLoading,
    deleteLoading,
  }
}
