import { Worker, type Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { config } from './config.js';
import { parseJsonFromModel } from './helpers.js';
import { parseRedisUrl } from 'shared/server';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: config.openaiApiKey });

const connection = parseRedisUrl(config.redisUrl) || {
  host: config.redisHost,
  port: config.redisPort,
  password: config.redisPassword || undefined,
  tls: config.redisTls ? {} : undefined,
};

type DecomposeJobData = {
  questId: string
  title: string
  goal?: string | null
  context?: string | null
  constraints?: string | null
}

async function processQuestJob(job: Job<DecomposeJobData>) {
  if (job.name !== 'decompose') {
    console.warn('Unknown quest job:', job.name);
    return;
  }

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

    type GeneratedTask = {
      title?: string
      details?: string
    }

    const tasks = parseJsonFromModel<GeneratedTask[]>(content);

    console.log('Parsed tasks:', tasks);

    for (let i = 0; i < tasks.length; i++) {
      const taskDefinition = tasks[i] ?? {};
      const title = typeof taskDefinition.title === 'string'
        ? taskDefinition.title.trim()
        : '';
      const details = typeof taskDefinition.details === 'string'
        ? taskDefinition.details.trim()
        : '';

      await prisma.task.create({
        data: {
          questId,
          title: title || `Task ${i + 1}`,
          details: details || null,
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

type InvestigateJobData = {
  investigationId: string
  taskId: string
  prompt?: string | null
}

async function processTaskInvestigation(job: Job<InvestigateJobData>) {
  if (job.name !== 'investigate-task') {
    console.warn('Unknown task job:', job.name);
    return;
  }

  const { investigationId } = job.data;
  console.log('Investigating task:', investigationId);

  const investigation = await prisma.taskInvestigation.findUnique({
    where: { id: investigationId },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          details: true,
          extraContent: true,
          quest: {
            select: {
              title: true,
              goal: true,
              context: true,
              constraints: true,
            },
          },
        },
      },
    },
  });

  if (!investigation || !investigation.task) {
    console.warn('Task investigation record missing:', investigationId);
    return;
  }

  const { task } = investigation;

  const promptSections = [
    `Task Title: ${task.title}`,
    task.details ? `Task Details: ${task.details}` : null,
    task.extraContent ? `Owner Notes: ${task.extraContent}` : null,
    task.quest?.title ? `Quest Title: ${task.quest.title}` : null,
    task.quest?.goal ? `Quest Goal: ${task.quest.goal}` : null,
    task.quest?.context ? `Quest Context: ${task.quest.context}` : null,
    task.quest?.constraints ? `Quest Constraints: ${task.quest.constraints}` : null,
    investigation.prompt ? `Investigation Context: ${investigation.prompt}` : null,
    job.data.prompt ? `Ad-hoc Context: ${job.data.prompt}` : null,
  ].filter((section): section is string => Boolean(section));

  const prompt = `You are a research assistant helping a user make progress on a task inside a personal quest planning app.
Analyze the information provided and brainstorm meaningful next steps, insights, or resources that could help the user move forward.

Return a JSON object with the shape {"summary": string, "details": string}. "summary" should be a short overview of the key findings.
"details" should contain a thorough analysis including concrete suggestions, risks, and recommended resources.

${promptSections.join('\n')}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.choices[0].message?.content || '';
    console.log('Investigation content:', content);

    const result = parseJsonFromModel<{ summary?: string; details?: string }>(content);

    await prisma.taskInvestigation.update({
      where: { id: investigationId },
      data: {
        status: 'completed',
        summary: result?.summary ?? 'Investigation completed.',
        details: result?.details ?? '',
        error: null,
      },
    });
  } catch (error) {
    console.error('Error during task investigation:', error);
    await prisma.taskInvestigation.update({
      where: { id: investigationId },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown investigation error',
      },
    });
  }
}

new Worker('quests', processQuestJob, { connection });
new Worker('tasks', processTaskInvestigation, { connection });

console.log('Questify worker is running...');
