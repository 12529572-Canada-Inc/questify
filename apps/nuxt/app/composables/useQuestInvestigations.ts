import { computed, ref, unref, watch, type MaybeRef } from 'vue'
import type { TaskWithInvestigations } from '~/types/quest-tasks'
import { resolveApiError } from '~/utils/error'

type InvestigateTaskFn = (taskId: string, prompt: string) => Promise<void>

export function useQuestInvestigations(options: {
  investigateTask: InvestigateTaskFn
  todoTasks: MaybeRef<TaskWithInvestigations[]>
  completedTasks: MaybeRef<TaskWithInvestigations[]>
}) {
  const { investigateTask, todoTasks, completedTasks } = options

  const investigationError = ref<string | null>(null)
  const investigatingTaskIds = ref<Set<string>>(new Set())
  const expandedInvestigationId = ref<string | null>(null)
  const investigationDialogOpen = ref(false)
  const investigationDialogSubmitting = ref(false)
  const investigationDialogError = ref<string | null>(null)
  const investigationPrompt = ref('')
  const investigationTargetTask = ref<TaskWithInvestigations | null>(null)

  const allTasks = computed(() => [...unref(todoTasks), ...unref(completedTasks)])

  const hasPendingInvestigations = computed(() =>
    allTasks.value.some(task =>
      task.investigations.some(investigation => investigation.status === 'pending'),
    ),
  )

  const investigatingTaskIdsList = computed(() => Array.from(investigatingTaskIds.value))

  function openInvestigationDialog(task: TaskWithInvestigations) {
    investigationTargetTask.value = task
    investigationPrompt.value = ''
    investigationDialogError.value = null
    investigationDialogOpen.value = true
  }

  function closeInvestigationDialog() {
    if (investigationDialogSubmitting.value) return
    investigationDialogOpen.value = false
    investigationTargetTask.value = null
    investigationPrompt.value = ''
  }

  function addInvestigatingTask(taskId: string) {
    investigatingTaskIds.value = new Set([...investigatingTaskIds.value, taskId])
  }

  function removeInvestigatingTask(taskId: string) {
    if (!investigatingTaskIds.value.has(taskId)) return
    const next = new Set(investigatingTaskIds.value)
    next.delete(taskId)
    investigatingTaskIds.value = next
  }

  async function submitInvestigation() {
    if (!investigationTargetTask.value) {
      return
    }

    const taskId = investigationTargetTask.value.id
    const prompt = investigationPrompt.value.trim()

    if (prompt.length === 0) {
      investigationDialogError.value = 'Please provide some context for the investigation.'
      return
    }

    if (prompt.length > 1000) {
      investigationDialogError.value = 'Please keep investigation context under 1000 characters.'
      return
    }

    investigationDialogSubmitting.value = true
    investigationDialogError.value = null
    investigationError.value = null

    addInvestigatingTask(taskId)

    try {
      await investigateTask(taskId, prompt)
      investigationDialogOpen.value = false
      investigationTargetTask.value = null
      investigationPrompt.value = ''
    }
    catch (err) {
      const message = resolveApiError(err, 'Unable to complete the investigation. Please try again.')
      investigationError.value = message
      investigationDialogError.value = message
    }
    finally {
      removeInvestigatingTask(taskId)
      investigationDialogSubmitting.value = false
    }
  }

  function toggleInvestigationExpansion(investigationId: string) {
    expandedInvestigationId.value = expandedInvestigationId.value === investigationId
      ? null
      : investigationId
  }

  watch(() => expandedInvestigationId.value, () => {
    if (!expandedInvestigationId.value) {
      return
    }
    const exists = allTasks.value.some(task =>
      task.investigations.some(investigation => investigation.id === expandedInvestigationId.value),
    )
    if (!exists) {
      expandedInvestigationId.value = null
    }
  })

  watch(investigationDialogOpen, (open) => {
    if (!open) {
      investigationDialogError.value = null
    }
  })

  return {
    investigationError,
    investigatingTaskIds,
    investigatingTaskIdsList,
    expandedInvestigationId,
    investigationDialogOpen,
    investigationDialogSubmitting,
    investigationDialogError,
    investigationPrompt,
    investigationTargetTask,
    hasPendingInvestigations,
    openInvestigationDialog,
    closeInvestigationDialog,
    submitInvestigation,
    toggleInvestigationExpansion,
  }
}
