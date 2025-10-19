import { setupQueue } from '../utils/queue'

export default defineNitroPlugin((nitroApp) => {
  setupQueue({
    nitroApp,
    queueName: 'quests',
    contextKey: 'questQueue',
    label: 'quest',
  })
})
