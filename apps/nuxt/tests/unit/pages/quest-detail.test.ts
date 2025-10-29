import '../support/mocks/vueuse'

import { computed, ref, h, Suspense } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import QuestDetailPage from '../../../app/pages/quests/[id].vue'
import { shallowMountWithBase } from '../support/mount-options'
import { createQuest, createTask, createTaskSection } from '../support/sample-data'
import { useUserStore } from '~/stores/user'

const refreshMock = vi.fn()
const completeQuest = vi.fn()
const reopenQuest = vi.fn()
const markTaskCompleted = vi.fn()
const markTaskIncomplete = vi.fn()
const updateTask = vi.fn()
const investigateTask = vi.fn()
const submitInvestigation = vi.fn()
const saveTaskEdits = vi.fn()
const showQuestShareDialog = vi.fn()
const showTaskShareDialog = vi.fn()
const globalWithNavigate = globalThis as typeof globalThis & { navigateTo?: (path: string) => Promise<unknown> }
const originalNavigateTo = globalWithNavigate.navigateTo

const todoTasks = ref([createTask()])
const completedTasks = ref([createTask({ id: 'task-2', status: 'completed' })])

beforeEach(() => {
  setActivePinia(createPinia())
  Reflect.set(globalWithNavigate, 'navigateTo', vi.fn(async () => undefined))

  refreshMock.mockReset()
  completeQuest.mockReset()
  reopenQuest.mockReset()
  markTaskCompleted.mockReset()
  markTaskIncomplete.mockReset()
  updateTask.mockReset()
  investigateTask.mockReset()
  submitInvestigation.mockReset()
  saveTaskEdits.mockReset()
  showQuestShareDialog.mockReset()
  showTaskShareDialog.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()

  if (originalNavigateTo) Reflect.set(globalWithNavigate, 'navigateTo', originalNavigateTo)
  else Reflect.deleteProperty(globalWithNavigate, 'navigateTo')
})

const sampleQuest = createQuest()
const sampleTasks = [createTask(), createTask({ id: 'task-2', status: 'completed' })]
const sampleSections = [createTaskSection({ tasks: sampleTasks })]

vi.mock('~/composables/useQuest', () => {
  const useQuest = vi.fn(async () => ({
    data: ref(sampleQuest),
    refresh: refreshMock,
    pending: ref(false),
    error: ref(null),
  }))

  const useQuests = vi.fn(async () => ({
    data: ref([sampleQuest]),
  }))

  return {
    useQuest,
    useQuests,
  }
})

vi.mock('~/composables/useQuestActions', () => ({
  useQuestActions: vi.fn(() => ({
    markTaskCompleted,
    markTaskIncomplete,
    updateTask,
    investigateTask,
    completeQuest,
    reopenQuest,
  })),
}))

vi.mock('~/composables/useQuestTasks', () => ({
  useQuestTasks: vi.fn(() => ({
    tasksLoading: ref(false),
    todoTasks,
    completedTasks,
    hasTasks: ref(true),
  })),
  useQuestTaskTabs: vi.fn(() => ({
    taskTab: ref('todo'),
  })),
}))

vi.mock('~/composables/useQuestTaskEditor', () => ({
  useQuestTaskEditor: vi.fn(() => ({
    taskEditDialogOpen: ref(false),
    taskEditSaving: ref(false),
    taskEditError: ref(null),
    taskEditForm: ref({
      title: 'Task title',
      details: 'Task details',
      extraContent: 'Extra',
    }),
    isTaskEditDirty: ref(true),
    openTaskEditDialog: vi.fn(),
    closeTaskEditDialog: vi.fn(),
    saveTaskEdits,
  })),
}))

vi.mock('~/composables/useQuestInvestigations', () => ({
  useQuestInvestigations: vi.fn(() => ({
    investigationError: ref(null),
    investigatingTaskIdsList: ref([]),
    investigationDialogOpen: ref(false),
    investigationDialogSubmitting: ref(false),
    investigationDialogError: ref(null),
    investigationPrompt: ref(''),
    investigationModelType: ref('gpt-4o-mini'),
    investigationModelOptions: ref([]),
    hasPendingInvestigations: ref(false),
    openInvestigationDialog: vi.fn(),
    closeInvestigationDialog: vi.fn(),
    submitInvestigation,
  })),
}))

vi.mock('~/composables/useQuestShareDialog', () => ({
  useQuestShareDialog: vi.fn(() => ({
    shareDialogState: ref(false),
    shareDialogVisible: computed(() => false),
    openQuestShare: showQuestShareDialog,
    openTaskShare: showTaskShareDialog,
  })),
}))

vi.mock('~/composables/useQuestTaskHighlight', () => ({
  useQuestTaskHighlight: vi.fn(),
}))

vi.mock('~/composables/useQuestPolling', () => ({
  useQuestPolling: vi.fn(),
}))

vi.mock('~/composables/useQuestDisplay', () => ({
  useQuestDisplay: vi.fn(() => ({
    questStatusMeta: {
      label: 'Active',
      icon: 'mdi-check',
      color: 'success',
    },
    taskSections: sampleSections,
  })),
  useQuestErrorAlert: vi.fn(() => ({
    questErrorAlert: computed(() => null),
  })),
}))

vi.mock('~/composables/useQuestLifecycle', () => ({
  useQuestLifecycle: vi.fn(() => ({
    archiveQuest: vi.fn(async () => true),
    deleteQuest: vi.fn(async () => true),
    archiveLoading: ref(false),
    deleteLoading: ref(false),
  })),
}))

describe('Quest detail page', () => {
  it('renders quest detail information with mocked composables', async () => {
    vi.stubGlobal('useRoute', () => ({
      params: { id: 'quest-1' },
      query: {},
    }))
    vi.stubGlobal('useRequestURL', () => ({
      origin: 'https://example.com',
    }))
    const sessionUser = ref({ id: 'user-1' })
    vi.stubGlobal('useUserSession', () => ({
      user: sessionUser,
      loggedIn: ref(true),
      fetch: vi.fn(),
      clear: vi.fn(),
      openInPopup: vi.fn(),
    }))
    const userStore = useUserStore()
    userStore.setUser(sessionUser.value)

    const wrapper = shallowMountWithBase({
      render() {
        return h(Suspense, {}, { default: () => h(QuestDetailPage) })
      },
    }, {
      global: {
        stubs: {
          QuestDetailsCard: { template: '<div class="quest-details-card-stub"></div>' },
          QuestTaskEditDialog: { template: '<div />' },
          QuestInvestigationDialog: { template: '<div />' },
          ShareDialog: { template: '<div />' },
          QuestActionButtons: { template: '<div />' },
          QuestDeleteDialog: { template: '<div />' },
        },
      },
    })

    expect(wrapper.exists()).toBe(true)
  })
})
