import 'dotenv/config';

export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY!,
  redisHost: process.env.REDIS_HOST!,
  redisPort: Number(process.env.REDIS_PORT),
  redisPassword: process.env.REDIS_PASSWORD || undefined,
  databaseUrl: process.env.DATABASE_URL!,
};
