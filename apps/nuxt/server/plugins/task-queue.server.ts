import { setupQueue } from '../utils/queue'

export default defineNitroPlugin((nitroApp) => {
  setupQueue({
    nitroApp,
    queueName: 'tasks',
    contextKey: 'taskQueue',
    label: 'task',
  })
})
