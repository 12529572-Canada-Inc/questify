import { describe, expect, it, beforeEach, vi } from 'vitest'
import { nextTick, h, defineComponent } from 'vue'
import ModelSelectField from '../../../app/components/common/ModelSelectField.vue'
import { mountWithBase } from '../support/mount-options'

const models = [
  {
    id: 'gpt-4o',
    label: 'GPT-4 Omni',
    providerLabel: 'OpenAI',
    description: 'General purpose model',
    tags: ['balanced', 'general'],
  },
  {
    id: 'deepseek-reasoner',
    label: 'Deepseek Reasoner',
    providerLabel: 'Deepseek',
    description: 'Structured reasoning assistant',
    tags: ['reasoning'],
  },
] as const

const VSelectStub = defineComponent({
  name: 'VSelectStub',
  props: {
    modelValue: {
      type: [String, null],
      default: null,
    },
    items: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit, slots }) {
    const emitValue = (value?: string) => emit('update:modelValue', value)
    return () =>
      h(
        'div',
        { 'data-test': 'v-select-stub' },
        [
          slots.selection?.({
            item: {
              value: props.modelValue,
              title: (props.items as any[])?.find(item => item.value === props.modelValue)?.title,
            },
          }),
          slots.item?.({
            item: (props.items as any[])?.[0],
            props: {
              onClick: () => emitValue((props.items as any[])?.[0]?.value),
            },
          }),
        ].filter(Boolean),
      )
  },
})

describe('ModelSelectField', () => {
  beforeEach(() => {
    vi.clearAllMocks?.()
  })

  it('renders initial model metadata and tags', () => {
    const wrapper = mountWithBase(ModelSelectField, {
      props: {
        models: models as any,
      },
      global: {
        stubs: {
          VSelect: VSelectStub,
        },
      },
    })

    expect(wrapper.text()).toContain('GPT-4 Omni')
    expect(wrapper.text()).toContain('OpenAI')
    expect(wrapper.text()).toContain('General purpose model')
    expect(wrapper.text()).toContain('balanced')
  })

  it('updates selected model when the select emits a value', async () => {
    const wrapper = mountWithBase(ModelSelectField, {
      props: {
        models: models as any,
        modelValue: 'gpt-4o',
      },
      global: {
        stubs: {
          VSelect: VSelectStub,
        },
      },
    })

    const select = wrapper.findComponent(VSelectStub)
    expect(select.exists()).toBe(true)

    select.vm.$emit('update:modelValue', 'deepseek-reasoner')
    await nextTick()

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.text()).toContain('Deepseek Reasoner')
    expect(wrapper.text()).toContain('Structured reasoning assistant')
    expect(wrapper.text()).not.toContain('General purpose model')
  })
})
