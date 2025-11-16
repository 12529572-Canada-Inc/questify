import type { VueWrapper } from '@vue/test-utils'
import { mount, shallowMount } from '@vue/test-utils'
import type { Component, ComponentPublicInstance } from 'vue'
import { h } from 'vue'
import { vi } from 'vitest'
import TextWithLinks from '../../../app/components/TextWithLinks.vue'
import QuestDetailsSummary from '../../../app/components/quests/QuestDetailsSummary.vue'
import QuestDetailsSections from '../../../app/components/quests/QuestDetailsSections.vue'
import QuestCard from '../../../app/components/quests/QuestCard.vue'

const simpleDivStub = { template: '<div><slot /></div>' }
const simpleButtonStub = { template: '<button><slot /></button>' }

const menuStub = {
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { slots, emit }) {
    const toggle = () => {
      emit('update:modelValue', !props.modelValue)
    }

    return () => h('div', { class: 'v-menu-stub' }, [
      slots.activator?.({ props: { onClick: toggle } }) ?? null,
      props.modelValue ? h('div', { class: 'v-menu-stub__content' }, slots.default?.() ?? null) : null,
    ])
  },
}

const baseGlobal = {
  config: {
    compilerOptions: {
      isCustomElement: (tag: string) => tag.startsWith('v-'),
    },
  },
  stubs: {
    NuxtLink: { template: '<a><slot /></a>' },
    ClientOnly: { template: '<div><slot /></div>' },
    Teleport: { template: '<div><slot /></div>' },
    VApp: simpleDivStub,
    VAppBar: simpleDivStub,
    VAppBarTitle: simpleDivStub,
    VAppBarNavIcon: simpleDivStub,
    VToolbar: simpleDivStub,
    VToolbarTitle: simpleDivStub,
    VNavigationDrawer: simpleDivStub,
    VMain: simpleDivStub,
    VContainer: simpleDivStub,
    VRow: simpleDivStub,
    VCol: simpleDivStub,
    VCard: simpleDivStub,
    VCardTitle: simpleDivStub,
    VCardText: simpleDivStub,
    VCardActions: simpleDivStub,
    VCardSubtitle: simpleDivStub,
    VCardItem: simpleDivStub,
    VBtn: simpleButtonStub,
    VIcon: { template: '<span><slot /></span>' },
    VBtnGroup: simpleDivStub,
    VList: simpleDivStub,
    VListItem: {
      inheritAttrs: false,
      setup(_, { attrs, slots }) {
        return () => h('div', { ...attrs }, slots.default?.())
      },
    },
    VListItemTitle: simpleDivStub,
    VListItemSubtitle: simpleDivStub,
    VAvatar: simpleDivStub,
    VDialog: simpleDivStub,
    VForm: { emits: ['submit'], template: '<form @submit.prevent="$emit(\'submit\')"><slot /></form>' },
    VTextField: { props: ['modelValue'], template: '<input />' },
    VTextarea: { props: ['modelValue'], template: '<textarea></textarea>' },
    VTooltip: simpleDivStub,
    VProgressCircular: simpleDivStub,
    VProgressLinear: simpleDivStub,
    VSpacer: simpleDivStub,
    VTabs: simpleDivStub,
    VTab: simpleDivStub,
    VTabItem: simpleDivStub,
    VWindow: simpleDivStub,
    VWindowItem: simpleDivStub,
    VExpansionPanels: simpleDivStub,
    VExpansionPanel: simpleDivStub,
    VExpansionPanelTitle: simpleDivStub,
    VExpansionPanelText: simpleDivStub,
    VBadge: simpleDivStub,
    VChip: simpleDivStub,
    VChipGroup: simpleDivStub,
    VMenu: menuStub,
    VSheet: simpleDivStub,
    VOverlay: simpleDivStub,
    VDivider: simpleDivStub,
    VSwitch: simpleDivStub,
    VSkeletonLoader: simpleDivStub,
    VExpandTransition: simpleDivStub,
    VAlert: simpleDivStub,
  },
  mocks: {
    $fetch: vi.fn(),
  },
  components: {
    TextWithLinks,
    QuestDetailsSummary,
    QuestDetailsSections,
    QuestCard,
  },
}

type MountOverrides = Parameters<typeof mount>[1]

function mergeMountOptions(overrides?: MountOverrides): MountOverrides {
  if (!overrides) {
    return { global: { ...baseGlobal, stubs: { ...baseGlobal.stubs } } }
  }

  const mergedGlobal = {
    ...baseGlobal,
    ...(overrides.global ?? {}),
    stubs: {
      ...baseGlobal.stubs,
      ...(overrides.global?.stubs ?? {}),
    },
    mocks: {
      ...baseGlobal.mocks,
      ...(overrides.global?.mocks ?? {}),
    },
  }

  return {
    ...overrides,
    global: mergedGlobal,
  }
}

export function mountWithBase(
  component: Component,
  overrides?: MountOverrides,
): VueWrapper<ComponentPublicInstance> {
  return mount(component, mergeMountOptions(overrides))
}

export function shallowMountWithBase(
  component: Component,
  overrides?: MountOverrides,
): VueWrapper<ComponentPublicInstance> {
  return shallowMount(component, mergeMountOptions(overrides))
}
