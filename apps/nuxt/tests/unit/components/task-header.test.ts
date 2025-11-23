import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskHeader from '~/components/tasks/TaskHeader.vue'

const vuetifyStubs = {
  VRow: { template: '<div class="v-row"><slot /></div>' },
  VCol: { template: '<div class="v-col"><slot /></div>' },
  VBtn: { props: ['to'], template: '<button class="v-btn" :data-to="to"><slot /></button>' },
  VIcon: { template: '<i class="v-icon"><slot /></i>' },
}

describe('TaskHeader', () => {
  it('renders title, description, and action button', () => {
    const wrapper = mount(TaskHeader, {
      props: {
        title: 'All Tasks',
        description: 'Review every task across quests.',
        actionLabel: 'Go to Quests',
        actionTo: '/quests',
        actionIcon: 'mdi-format-list-bulleted-square',
      },
      global: {
        stubs: vuetifyStubs,
      },
    })

    expect(wrapper.text()).toContain('All Tasks')
    expect(wrapper.text()).toContain('Review every task across quests.')
    const button = wrapper.find('button.v-btn')
    expect(button.exists()).toBe(true)
    expect(button.attributes('data-to')).toBe('/quests')
    expect(button.text()).toContain('Go to Quests')
  })

  it('omits the action button when label and target are missing', () => {
    const wrapper = mount(TaskHeader, {
      props: {
        title: 'My Tasks',
        description: 'Focus on tasks assigned to you.',
      },
      global: {
        stubs: vuetifyStubs,
      },
    })

    expect(wrapper.text()).toContain('My Tasks')
    expect(wrapper.find('button.v-btn').exists()).toBe(false)
  })

  it('falls back to defaults when optional props are omitted', () => {
    const wrapper = mount(TaskHeader, {
      global: {
        stubs: vuetifyStubs,
      },
    })

    expect(wrapper.text()).toContain('Tasks')
    expect(wrapper.text()).not.toContain('undefined')
    expect(wrapper.find('button.v-btn').exists()).toBe(false)
  })
})
