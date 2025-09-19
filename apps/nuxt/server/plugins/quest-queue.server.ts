import { Queue } from 'bullmq';

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig();

  const questQueue = new Queue('quests', {
    connection: {
      host: config.redis.host,
      port: Number(config.redis.port),
      password: config.redis.password || undefined,
    },
  });

  // Register the queue in Nitro's context
  nitroApp.hooks.hook('request', (event) => {
    event.context.questQueue = questQueue;
  });
});
