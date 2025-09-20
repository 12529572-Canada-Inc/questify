import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import IndexPage from '~/pages/index.vue'

describe('IndexPage', () => {
  it('renders welcome text', () => {
    const wrapper = mount(IndexPage)
    expect(wrapper.text()).toContain('Welcome')
  })
})
