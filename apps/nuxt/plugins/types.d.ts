import type { Queue } from 'bullmq'

declare module '#app' {
  interface NuxtApp {
    $questQueue: Queue
  }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $questQueue: Queue
  }
}
