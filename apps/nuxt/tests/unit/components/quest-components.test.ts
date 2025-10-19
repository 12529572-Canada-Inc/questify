import '../support/mocks/vueuse'

import type { ComponentPublicInstance } from 'vue'
import type { VueWrapper } from '@vue/test-utils'
import { computed, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import QuestActionButtons from '../../../app/components/quests/QuestActionButtons.vue'
import QuestCard from '../../../app/components/quests/QuestCard.vue'
import QuestDetailsCard from '../../../app/components/quests/QuestDetailsCard.vue'
import QuestDetailsSections from '../../../app/components/quests/QuestDetailsSections.vue'
import QuestDetailsSummary from '../../../app/components/quests/QuestDetailsSummary.vue'
import QuestForm from '../../../app/components/quests/QuestForm.vue'
import QuestInvestigationDialog from '../../../app/components/quests/QuestInvestigationDialog.vue'
import QuestList from '../../../app/components/quests/QuestList.vue'
import QuestOwnerInfo from '../../../app/components/quests/QuestOwnerInfo.vue'
import QuestTaskActions from '../../../app/components/quests/QuestTaskActions.vue'
import QuestTaskEditDialog from '../../../app/components/quests/QuestTaskEditDialog.vue'
import QuestTaskInvestigationItem from '../../../app/components/quests/QuestTaskInvestigationItem.vue'
import QuestTaskInvestigationList from '../../../app/components/quests/QuestTaskInvestigationList.vue'
import QuestTaskInvestigations from '../../../app/components/quests/QuestTaskInvestigations.vue'
import QuestTaskListItem from '../../../app/components/quests/QuestTaskListItem.vue'
import QuestTaskListItemCompact from '../../../app/components/quests/QuestTaskListItemCompact.vue'
import QuestTaskSection from '../../../app/components/quests/QuestTaskSection.vue'
import QuestTasksTabs from '../../../app/components/quests/QuestTasksTabs.vue'
import { shallowMountWithBase, mountWithBase } from '../support/mount-options'
import { createInvestigation, createQuest, createTask, createTaskSection } from '../support/sample-data'

type DetailedSection = {
  key: string
  label: string
  text: string
}

type SetupState = Record<string, unknown> & {
  handleComplete?: () => void
  handleReopen?: () => void
  toggleOptionalFields?: () => void
  handleCancel?: () => void
  handleSubmit?: () => void
  handleSectionAction?: () => void
  handleSave?: () => void
  onToggle?: () => void
  handleToggle?: (id: string) => void
  toggleInvestigation?: (id: string) => void
  executeSectionAction?: (id: string) => void
  handleAction?: (action: { handler: () => void }) => void
}

const getSetupState = (wrapper: VueWrapper<ComponentPublicInstance>) => (
  (wrapper.vm as ComponentPublicInstance & { $: { setupState?: SetupState } }).$?.setupState ?? {}
) as SetupState

if (!('useQuestDetails' in globalThis)) {
  Object.assign(globalThis, {
    useQuestDetails: (quest: Record<string, unknown> | null, options?: { labels?: Record<string, string> }) => {
      const labels = options?.labels ?? {
        goal: 'Goal',
        context: 'Context',
        constraints: 'Constraints',
      }

      const sections = ref(
        ['goal', 'context', 'constraints']
          .map((key) => {
            const value = quest?.[key] as string | null | undefined
            if (typeof value === 'string' && value.trim().length > 0) {
              return {
                key,
                label: labels[key] ?? key,
                text: value,
              }
            }
            return null
          })
          .filter((section): section is DetailedSection => Boolean(section)),
      )

      return {
        sections,
        hasDetails: computed(() => sections.value.length > 0),
      }
    },
  })
}

vi.mock('~/composables/useQuestForm', () => {
  const title = ref('Quest Title')
  const goal = ref('Quest Goal')
  const context = ref('Some context')
  const constraints = ref('No constraints')
  const showOptionalFields = ref(true)
  return {
    useQuestForm: () => ({
      title,
      goal,
      context,
      constraints,
      showOptionalFields,
      valid: ref(true),
      loading: ref(false),
      error: ref(null),
      rules: {
        title: [(value: string) => (!!value || 'Required')],
      },
      isSubmitDisabled: ref(false),
      submit: vi.fn(),
      toggleOptionalFields: vi.fn(() => { showOptionalFields.value = !showOptionalFields.value }),
    }),
  }
})

const sampleQuest = createQuest()
const sampleTask = createTask()
const sampleSection = createTaskSection()

describe('quest components', () => {
  it('renders QuestActionButtons and completes quest when allowed', () => {
    const wrapper = shallowMountWithBase(QuestActionButtons, {
      props: {
        isOwner: true,
        questStatus: 'draft',
      },
    })

    expect(wrapper.exists()).toBe(true)
    const state = getSetupState(wrapper)
    state.handleComplete?.()
    expect(wrapper.emitted('complete-quest')).toBeTruthy()
  })

  it('renders QuestActionButtons and reopens quests', () => {
    const wrapper = shallowMountWithBase(QuestActionButtons, {
      props: {
        isOwner: true,
        questStatus: 'completed',
      },
    })

    expect(wrapper.exists()).toBe(true)
    const state = getSetupState(wrapper)
    state.handleReopen?.()
    expect(wrapper.emitted('reopen-quest')).toBeTruthy()
  })

  it('renders QuestCard summary', () => {
    const wrapper = shallowMountWithBase(QuestCard, {
      props: {
        quest: sampleQuest,
      },
    })

    expect(wrapper.text()).toContain('Launch Quest')
  })

  it('renders QuestDetailsSections with decorated output', () => {
    const wrapper = shallowMountWithBase(QuestDetailsSections, {
      props: {
        quest: sampleQuest,
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('renders QuestDetailsSummary fallback when empty', () => {
    const wrapper = shallowMountWithBase(QuestDetailsSummary, {
      props: {
        quest: {
          goal: null,
          context: null,
          constraints: null,
        },
        emptyMessage: 'Nothing here',
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('renders QuestDetailsSummary with sections', () => {
    const wrapper = shallowMountWithBase(QuestDetailsSummary, {
      props: {
        quest: sampleQuest,
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('renders QuestForm with mocked composable', async () => {
    const wrapper = mountWithBase(QuestForm, {
      props: { showBackButton: true },
    })

    const vm = wrapper.vm as ComponentPublicInstance & { submit?: () => Promise<void> }
    await vm.submit?.()
    const formState = getSetupState(wrapper)
    formState.toggleOptionalFields?.()
    expect(wrapper.text()).toContain('Create Quest')
  })

  it('renders QuestInvestigationDialog and exposes controls', () => {
    const wrapper = shallowMountWithBase(QuestInvestigationDialog, {
      props: {
        modelValue: true,
        prompt: 'Investigate blockers',
        submitting: false,
        error: null,
      },
    })

    expect(wrapper.exists()).toBe(true)
    const dialogState = getSetupState(wrapper)
    dialogState.handleCancel?.()
    dialogState.handleSubmit?.()
  })

  it('renders QuestList with quest entries', () => {
    const wrapper = shallowMountWithBase(QuestList, {
      props: {
        quests: [sampleQuest],
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('renders QuestOwnerInfo', () => {
    const wrapper = shallowMountWithBase(QuestOwnerInfo, {
      props: {
        owner: { name: 'Quest Owner' },
      },
    })

    expect(wrapper.text()).toContain('Quest Owner')
  })

  it('renders QuestTaskActions in compact mode', () => {
    const wrapper = shallowMountWithBase(QuestTaskActions, {
      props: {
        task: sampleTask,
        isOwner: true,
        pending: false,
        compact: true,
        hideOwnerActions: false,
        hasPendingInvestigation: false,
        sectionAction: sampleSection.action,
      },
    })

    expect(wrapper.exists()).toBe(true)
    const state = getSetupState(wrapper)
    state.handleSectionAction?.()
    expect(wrapper.emitted('execute-section-action')).toBeTruthy()
  })

  it('renders QuestTaskActions full layout for owners', () => {
    const wrapper = shallowMountWithBase(QuestTaskActions, {
      props: {
        task: sampleTask,
        isOwner: true,
        pending: false,
        compact: false,
        hideOwnerActions: false,
        hasPendingInvestigation: false,
        sectionAction: sampleSection.action,
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('renders QuestTaskEditDialog controls', () => {
    const wrapper = shallowMountWithBase(QuestTaskEditDialog, {
      props: {
        modelValue: true,
        saving: false,
        error: null,
        title: 'Task title',
        details: 'Task details',
        extraContent: 'Extra',
        isDirty: true,
      },
    })

    expect(wrapper.text()).toContain('Edit Task')
    const editState = getSetupState(wrapper)
    editState.handleSave?.()
    editState.handleCancel?.()
  })

  it('renders QuestTaskInvestigationItem summary', () => {
    const wrapper = shallowMountWithBase(QuestTaskInvestigationItem, {
      props: {
        investigation: createTask().investigations[0],
        expanded: true,
      },
    })

    expect(wrapper.text()).toContain('Summary')
    const itemState = getSetupState(wrapper)
    itemState.onToggle?.()
  })

  it('renders QuestTaskInvestigationList with list items', () => {
    const wrapper = shallowMountWithBase(QuestTaskInvestigationList, {
      props: {
        investigations: createTask().investigations,
        expandedInvestigationId: 'inv-1',
      },
    })

    expect(wrapper.findAllComponents(QuestTaskInvestigationItem).length).toBeGreaterThan(0)
    const listState = getSetupState(wrapper)
    listState.handleToggle?.('inv-1')
  })

  it('renders QuestTaskInvestigations and toggles', () => {
    const toggleSpy = vi.fn()
    const wrapper = shallowMountWithBase(QuestTaskInvestigations, {
      props: {
        task: createTask(),
        expandedInvestigationId: 'inv-1',
      },
      attrs: {
        onToggle: toggleSpy,
      },
    })

    expect(wrapper.text()).toContain('Investigations')
    const investigationsState = getSetupState(wrapper)
    investigationsState.toggleInvestigation?.('inv-1')
    expect(toggleSpy).toHaveBeenCalledWith('inv-1')
  })

  it('renders QuestTaskListItem with actions', () => {
    const wrapper = shallowMountWithBase(QuestTaskListItem, {
      props: {
        task: createTask(),
        sectionCompleted: false,
        sectionAction: sampleSection.action,
        isOwner: true,
        pending: false,
        compactActions: false,
        hideOwnerActions: false,
        highlightedTaskId: null,
        hasPendingInvestigation: false,
        expandedInvestigationId: 'inv-1',
      },
    })

    expect(wrapper.find('.task-list-item').exists()).toBe(true)
    const listItemState = getSetupState(wrapper)
    listItemState.toggleInvestigation?.('inv-1')
    expect(wrapper.emitted('toggle-investigation')).toBeTruthy()
  })

  it('renders QuestTaskListItemCompact and handles actions', () => {
    const handler = vi.fn()
    const wrapper = shallowMountWithBase(QuestTaskListItemCompact, {
      props: {
        highlighted: true,
        taskId: 'task-1',
        actions: [
          { label: 'Share', icon: 'mdi-share', handler },
        ],
      },
      slots: {
        title: '<span>Compact Title</span>',
        subtitle: '<span>Compact Subtitle</span>',
      },
    })

    expect(wrapper.exists()).toBe(true)
    const compactState = getSetupState(wrapper)
    compactState.handleAction?.({ label: 'Share', icon: 'mdi-share', handler })
    expect(handler).toHaveBeenCalled()
  })

  it('renders QuestTaskSection with tasks', () => {
    const wrapper = shallowMountWithBase(QuestTaskSection, {
      props: {
        section: sampleSection,
        isOwner: true,
        pending: false,
        compactActions: false,
        hideOwnerActions: false,
        highlightedTaskId: null,
        expandedInvestigationId: null,
        hasPendingInvestigation: () => false,
      },
    })

    expect(wrapper.text()).toContain(sampleSection.title)
    const sectionState = getSetupState(wrapper)
    sectionState.executeSectionAction?.(sampleTask.id)
    expect(sampleSection.action?.handler).toHaveBeenCalledWith(sampleTask.id)
  })

  it('renders QuestTasksTabs with sections', () => {
    const wrapper = shallowMountWithBase(QuestTasksTabs, {
      props: {
        modelValue: 'todo',
        sections: [sampleSection],
        pending: false,
        tasksLoading: false,
        isOwner: true,
        hasTasks: true,
        investigatingTaskIds: [],
        highlightedTaskId: null,
      },
    })

    expect(wrapper.text()).toContain('Tasks')
    const vm = wrapper.vm as ComponentPublicInstance & {
      hasPendingInvestigation?: (task: ReturnType<typeof createTask>) => boolean
      toggleInvestigationExpansion?: (id: string) => void
      taskTab?: { value: string }
    }
    const pendingTask = createTask({ investigations: [createInvestigation({ status: 'pending' })] })
    expect(vm.hasPendingInvestigation?.(pendingTask)).toBe(true)
    vm.toggleInvestigationExpansion?.('inv-1')
  })

  it('renders QuestDetailsCard with tabs and slots', () => {
    const wrapper = shallowMountWithBase(QuestDetailsCard, {
      props: {
        quest: sampleQuest,
        isOwner: true,
        questStatusMeta: {
          label: 'Active',
          icon: 'mdi-check',
          color: 'success',
        },
        taskSections: [sampleSection],
        taskTab: 'todo',
        tasksLoading: false,
        pending: false,
        hasTasks: true,
        investigatingTaskIds: [],
        highlightedTaskId: null,
        investigationError: null,
      },
      slots: {
        actions: '<button>Actions Slot</button>',
      },
    })

    expect(wrapper.text()).toContain('Launch Quest')
    expect(wrapper.text()).toContain('Actions Slot')
    const vm = wrapper.vm as ComponentPublicInstance & { taskTab?: { value: string } }
    if (vm.taskTab) vm.taskTab.value = 'completed'
  })
})
