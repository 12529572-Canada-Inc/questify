import type { VueWrapper } from '@vue/test-utils'
import { mount, shallowMount } from '@vue/test-utils'
import type { Component, ComponentPublicInstance } from 'vue'
import { vi } from 'vitest'

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
  },
  mocks: {
    $fetch: vi.fn(),
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
