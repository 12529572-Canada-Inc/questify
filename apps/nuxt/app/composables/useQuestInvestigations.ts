import { computed, ref, unref, watch, type MaybeRef } from 'vue'
import type { TaskWithInvestigations } from '~/types/quest-tasks'
import { resolveApiError } from '~/utils/error'
import { useAiModels } from './useAiModels'

type InvestigateTaskFn = (taskId: string, payload: { prompt: string, modelType: string, images?: string[] }) => Promise<void>

/**
 * Centralizes the state, dialogs, and helpers needed to launch AI investigations
 * for individual tasks, tracking pending jobs and coordinating model selection.
 *
 * @param options.investigateTask - Mutation handler for triggering investigations.
 * @param options.todoTasks - Reactive list of open tasks.
 * @param options.completedTasks - Reactive list of completed tasks.
 * @param options.questModelType - Optional quest-level model override.
 */
export function useQuestInvestigations(options: {
  investigateTask: InvestigateTaskFn
  todoTasks: MaybeRef<TaskWithInvestigations[]>
  completedTasks: MaybeRef<TaskWithInvestigations[]>
  questModelType?: MaybeRef<string | null>
}) {
  const { investigateTask, todoTasks, completedTasks, questModelType } = options
  const { models: modelOptions, findModelById, defaultModel } = useAiModels()

  const investigationError = ref<string | null>(null)
  const investigatingTaskIds = ref<Set<string>>(new Set())
  const expandedInvestigationId = ref<string | null>(null)
  const investigationDialogOpen = ref(false)
  const investigationDialogSubmitting = ref(false)
  const investigationDialogError = ref<string | null>(null)
  const investigationPrompt = ref('')
  const investigationImages = ref<string[]>([])
  const investigationTargetTask = ref<TaskWithInvestigations | null>(null)
  const questModel = computed(() => unref(questModelType) ?? null)
  const investigationModelType = ref((findModelById(questModel.value) ?? defaultModel.value)?.id ?? '')

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
    investigationImages.value = []
    investigationDialogError.value = null
    investigationModelType.value = (findModelById(questModel.value) ?? defaultModel.value)?.id ?? investigationModelType.value
    investigationDialogOpen.value = true
  }

  function closeInvestigationDialog() {
    if (investigationDialogSubmitting.value) return
    investigationDialogOpen.value = false
    investigationTargetTask.value = null
    investigationPrompt.value = ''
    investigationImages.value = []
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

    const selectedModel = findModelById(investigationModelType.value)
    if (!selectedModel) {
      investigationDialogError.value = 'No AI models are configured for this environment.'
      return
    }

    const taskId = investigationTargetTask.value.id
    const prompt = investigationPrompt.value.trim()

    if (prompt.length === 0 && investigationImages.value.length === 0) {
      investigationDialogError.value = 'Add a prompt or at least one image to start the investigation.'
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
      await investigateTask(taskId, {
        prompt,
        modelType: selectedModel.id,
        images: investigationImages.value,
      })
      investigationDialogOpen.value = false
      investigationTargetTask.value = null
      investigationPrompt.value = ''
      investigationImages.value = []
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

  watch(questModel, (next) => {
    if (!investigationDialogOpen.value) {
      investigationModelType.value = (findModelById(next) ?? defaultModel.value)?.id ?? investigationModelType.value
    }
  }, { immediate: true })

  return {
    investigationError,
    investigatingTaskIds,
    investigatingTaskIdsList,
    expandedInvestigationId,
    investigationDialogOpen,
    investigationDialogSubmitting,
    investigationDialogError,
    investigationPrompt,
    investigationImages,
    investigationTargetTask,
    investigationModelType,
    investigationModelOptions: modelOptions,
    hasPendingInvestigations,
    openInvestigationDialog,
    closeInvestigationDialog,
    submitInvestigation,
    toggleInvestigationExpansion,
  }
}
