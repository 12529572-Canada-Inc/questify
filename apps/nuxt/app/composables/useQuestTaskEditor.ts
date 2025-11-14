import { computed, ref, watch } from 'vue'
import type { TaskWithInvestigations } from '~/types/quest-tasks'
import { resolveApiError } from '~/utils/error'

type UpdateTaskPayload = {
  title: string
  details: string | null
  extraContent: string | null
}

type UpdateTaskFn = (taskId: string, payload: UpdateTaskPayload) => Promise<void>

/**
 * Tracks dialog state and dirty forms for editing quest tasks, surfacing helpers
 * to open a task in edit mode, validate changes, and submit updates with error handling.
 *
 * @param updateTask - Mutation handler invoked when saving task edits.
 */
export function useQuestTaskEditor(updateTask: UpdateTaskFn) {
  const taskEditDialogOpen = ref(false)
  const taskEditSaving = ref(false)
  const taskEditError = ref<string | null>(null)
  const taskBeingEdited = ref<TaskWithInvestigations | null>(null)
  const taskEditForm = ref({
    title: '',
    details: '',
    extraContent: '',
  })
  const taskEditBaseline = ref({
    title: '',
    details: '',
    extraContent: '',
  })

  const isTaskEditDirty = computed(() => {
    if (!taskBeingEdited.value) {
      return false
    }

    return (
      taskEditForm.value.title !== taskEditBaseline.value.title
      || taskEditForm.value.details !== taskEditBaseline.value.details
      || taskEditForm.value.extraContent !== taskEditBaseline.value.extraContent
    )
  })

  function normalizeOptionalContent(value: string) {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  function openTaskEditDialog(task: TaskWithInvestigations) {
    taskBeingEdited.value = task
    taskEditForm.value = {
      title: task.title,
      details: task.details ?? '',
      extraContent: task.extraContent ?? '',
    }
    taskEditBaseline.value = { ...taskEditForm.value }
    taskEditError.value = null
    taskEditDialogOpen.value = true
  }

  function closeTaskEditDialog() {
    taskEditDialogOpen.value = false
  }

  async function saveTaskEdits() {
    if (!taskBeingEdited.value) {
      return
    }

    const title = taskEditForm.value.title.trim()

    if (!title) {
      taskEditError.value = 'Task title is required.'
      return
    }

    taskEditSaving.value = true
    taskEditError.value = null

    try {
      await updateTask(taskBeingEdited.value.id, {
        title,
        details: normalizeOptionalContent(taskEditForm.value.details),
        extraContent: normalizeOptionalContent(taskEditForm.value.extraContent),
      })
      taskEditDialogOpen.value = false
      taskEditBaseline.value = { ...taskEditForm.value }
    }
    catch (err) {
      taskEditError.value = resolveApiError(err, 'Unable to update the task. Please try again.')
    }
    finally {
      taskEditSaving.value = false
    }
  }

  watch(taskEditDialogOpen, (isOpen) => {
    if (!isOpen) {
      taskBeingEdited.value = null
      taskEditForm.value = {
        title: '',
        details: '',
        extraContent: '',
      }
      taskEditError.value = null
    }
  })

  return {
    taskEditDialogOpen,
    taskEditSaving,
    taskEditError,
    taskBeingEdited,
    taskEditForm,
    taskEditBaseline,
    isTaskEditDirty,
    openTaskEditDialog,
    closeTaskEditDialog,
    saveTaskEdits,
  }
}
