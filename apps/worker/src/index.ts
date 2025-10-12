import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { config } from './config.js';
import { parseJsonFromModel } from './helpers.js';
import { parseRedisUrl } from 'shared';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: config.openaiApiKey });

new Worker(
  'quests',
  async (job) => {
    if (job.name === 'decompose') {
      console.log('Decomposing quest:', job.data);
      const { questId, title, goal, context, constraints } = job.data;

      const promptSections = [
        `Quest Title: ${title}`,
        goal ? `Desired Outcome: ${goal}` : null,
        context ? `Additional Context: ${context}` : null,
        constraints ? `Constraints or Preferences: ${constraints}` : null,
      ].filter((section): section is string => Boolean(section));

      const prompt = `You are an expert project planner. Based on the following quest information, break the work down into a
    thoughtfully ordered list of actionable sub-tasks. Each task should be specific enough to execute without additional
    clarification and collectively lead to the desired outcome.

${promptSections.join('\n')}

Return the plan as a JSON array where each item has the shape {"title": string, "details": string}.`;
      console.log('Prompt:', prompt);
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
        });

        console.log('OpenAI response:', response);

        const content = response.choices[0].message?.content || '';
        console.log('OpenAI content:', content);

        // Use the helper function to parse JSON
        const tasks = parseJsonFromModel(content);

        console.log('Parsed tasks:', tasks);

        for (let i = 0; i < tasks.length; i++) {
          await prisma.task.create({
            data: {
              questId,
              title: tasks[i].title,
              details: tasks[i].details,
              order: i,
            },
          });
        }

        await prisma.quest.update({
          where: { id: questId },
          data: { status: 'active' },
        });
      } catch (error) {
        console.error('Error during quest decomposition:', error);
        await prisma.quest.update({
          where: { id: questId },
          data: { status: 'failed' },
        });
      }
    }
  },
  {
    connection: parseRedisUrl(config.redisUrl) || {
      host: config.redisHost,
      port: config.redisPort,
      password: config.redisPassword || undefined,
      tls: config.redisTls ? {} : undefined,
    },
  },
);

console.log('Questify worker is running...');
