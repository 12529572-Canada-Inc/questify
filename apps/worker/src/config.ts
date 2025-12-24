import 'dotenv/config';

export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY!,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  anthropicApiVersion: process.env.ANTHROPIC_API_VERSION || '2023-06-01',
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
  deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
  aiMaxResponseTokens: Number(process.env.AI_MAX_RESPONSE_TOKENS) || 0,
  logMaxChars: Number(process.env.WORKER_LOG_MAX_CHARS) || 0,
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: Number(process.env.REDIS_PORT) || 6379,
  redisPassword: process.env.REDIS_PASSWORD || undefined,
  redisUrl: process.env.REDIS_URL || '',
  redisTls: process.env.REDIS_TLS === 'true',
  databaseUrl: process.env.DATABASE_URL!,
};
