import { computed, ref } from 'vue'

type ShareDialogContent = {
  title: string
  description: string
  url: string
}

/**
 * Builds the reactive state used by the quest/task share dialog, supplying
 * helper methods to open/close the modal with prefilled messaging.
 *
 * @param questUrlBuilder - Function returning the shareable quest URL.
 * @param taskUrlBuilder - Function returning the shareable task URL by id.
 */
export function useQuestShareDialog(questUrlBuilder: () => string, taskUrlBuilder: (taskId: string) => string) {
  const shareDialogState = ref<ShareDialogContent | null>(null)

  const shareDialogVisible = computed({
    get: () => shareDialogState.value !== null,
    set: (value: boolean) => {
      if (!value) {
        shareDialogState.value = null
      }
    },
  })

  function openQuestShare(title: string) {
    shareDialogState.value = {
      title: 'Share quest',
      description: `Share "${title}" with teammates. They will need to sign in to view this quest.`,
      url: questUrlBuilder(),
    }
  }

  function openTaskShare(taskTitle: string, questTitle: string | undefined, taskId: string) {
    shareDialogState.value = {
      title: 'Share task',
      description: `Share the task "${taskTitle}" from "${questTitle ?? 'this quest'}". Recipients land on the quest page with the task highlighted.`,
      url: taskUrlBuilder(taskId),
    }
  }

  return {
    shareDialogState,
    shareDialogVisible,
    openQuestShare,
    openTaskShare,
  }
}
