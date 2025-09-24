import 'dotenv/config';

export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY!,
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: Number(process.env.REDIS_PORT) || 6379,
  redisPassword: process.env.REDIS_PASSWORD || undefined,
  redisUrl: process.env.REDIS_URL || '',
  redisTls: process.env.REDIS_TLS === 'true',
  databaseUrl: process.env.DATABASE_URL!,
};
