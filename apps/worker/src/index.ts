import { Worker, type Job } from 'bullmq';
import { QuestStatus } from '@prisma/client';
import OpenAI from 'openai';
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions';
import { findModelOption, resolveModelId, type AiModelOption } from 'shared';
import { loadModelConfig, parseRedisUrl, parseJsonFromModel, prisma } from 'shared/server';
import { config } from './config.js';

const { models: aiModels, defaultModelId } = loadModelConfig();
if (!aiModels.length) {
  throw new Error('No AI models configured. Provide at least one AI model in the configuration.');
}

const openai = config.openaiApiKey ? new OpenAI({ apiKey: config.openaiApiKey }) : null;
const deepseek = config.deepseekApiKey
  ? new OpenAI({
    apiKey: config.deepseekApiKey,
    baseURL: config.deepseekBaseUrl,
  })
  : null;
const anthropicApiKey = config.anthropicApiKey;
const anthropicApiVersion = config.anthropicApiVersion;

const connection = parseRedisUrl(config.redisUrl) || {
  host: config.redisHost,
  port: config.redisPort,
  password: config.redisPassword || undefined,
  tls: config.redisTls ? {} : undefined,
};

function resolveModel(modelId?: string | null): AiModelOption {
  const normalizedId = resolveModelId(aiModels, modelId ?? defaultModelId);
  return findModelOption(aiModels, normalizedId) ?? aiModels[0];
}

async function callOpenAiClient(client: OpenAI | null, model: AiModelOption, prompt: string) {
  if (!client) {
    throw new Error(`Missing API client for provider ${model.provider}`);
  }

  const response = await client.chat.completions.create({
    model: model.apiModel,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.choices[0].message?.content ?? '';
}

async function callAnthropicModel(model: AiModelOption, prompt: string) {
  if (!anthropicApiKey) {
    throw new Error('Missing API client for provider anthropic');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': anthropicApiVersion,
    },
    body: JSON.stringify({
      model: model.apiModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1200,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${errorText || response.statusText}`);
  }

  const payload = await response.json() as { content?: Array<{ text?: string }> };
  return (payload.content ?? [])
    .map(item => (typeof item.text === 'string' ? item.text : ''))
    .join('\n')
    .trim();
}

type RunModelResult = { content: string, modelId: string };

async function runModel(
  prompt: string,
  requestedModelId?: string | null,
  allowFallback = true,
  images: string[] = [],
): Promise<RunModelResult> {
  const model = resolveModel(requestedModelId);
  const sanitizedImages = Array.isArray(images) ? images.filter(Boolean) : [];

  try {
    let content = '';
    if (model.provider === 'openai') {
      if (!openai) {
        throw new Error(`Missing API client for provider ${model.provider}`);
      }

      const imageParts: ChatCompletionContentPart[] = sanitizedImages.map(image => ({
        type: 'image_url' as const,
        image_url: { url: image, detail: 'auto' as const },
      }));

      const contentParts: ChatCompletionContentPart[] = [
        { type: 'text', text: prompt },
        ...imageParts,
      ];

      const response = await openai.chat.completions.create({
        model: model.apiModel,
        messages: [{
          role: 'user',
          content: contentParts,
        }],
      });
      content = response?.choices[0].message?.content ?? '';
    }
    else if (model.provider === 'deepseek') {
      const note = sanitizedImages.length
        ? `${prompt}\n\n(${sanitizedImages.length} image(s) attached but ignored by this model.)`
        : prompt;
      content = await callOpenAiClient(deepseek, model, note);
    }
    else {
      const note = sanitizedImages.length
        ? `${prompt}\n\n(${sanitizedImages.length} image(s) attached; image content omitted for this model.)`
        : prompt;
      content = await callAnthropicModel(model, note);
    }

    return { content, modelId: model.id };
  }
  catch (error) {
    if (allowFallback && model.id !== defaultModelId) {
      console.warn(`Model ${model.id} failed (${(error as Error).message}); falling back to ${defaultModelId}`);
      return runModel(prompt, defaultModelId, false, sanitizedImages);
    }
    throw error;
  }
}

type DecomposeJobData = {
  questId: string
  title: string
  goal?: string | null
  context?: string | null
  constraints?: string | null
  modelType?: string | null
  images?: string[]
}

async function processQuestJob(job: Job<DecomposeJobData>) {
  if (job.name !== 'decompose') {
    console.warn('Unknown quest job:', job.name);
    return;
  }

  console.log('Decomposing quest:', job.data);
  const { questId, title, goal, context, constraints, images } = job.data;

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
${images?.length ? `\nThe user attached ${images.length} image(s); incorporate visual details if your model supports images.\n` : ''}

Return the plan as a JSON array where each item has the shape {"title": string, "details": string}.`;
  console.log('Prompt:', prompt);

  try {
    const { content, modelId } = await runModel(prompt, job.data.modelType, true, images);
    console.log(`AI (${modelId}) content:`, content);

    type GeneratedTask = {
      title?: string
      details?: string
    }

    const tasks = parseJsonFromModel<GeneratedTask[]>(content);
    const parsedTasks = Array.isArray(tasks) ? tasks : [];

    console.log('Parsed tasks:', parsedTasks);

    const preparedTasks = parsedTasks
      .map((taskDefinition, index) => {
        const titleText = typeof taskDefinition?.title === 'string'
          ? taskDefinition.title.trim()
          : '';
        const detailText = typeof taskDefinition?.details === 'string'
          ? taskDefinition.details.trim()
          : '';

        return {
          questId,
          title: titleText || `Task ${index + 1}`,
          details: detailText || null,
          order: index,
        };
      })
      .filter(task => task.title.length > 0);

    if (!preparedTasks.length) {
      preparedTasks.push({
        questId,
        title: 'First Task',
        details: null,
        order: 0,
      });
    }

    await prisma.$transaction([
      prisma.task.deleteMany({ where: { questId } }),
      prisma.task.createMany({ data: preparedTasks }),
      prisma.quest.update({
        where: { id: questId },
        data: { status: QuestStatus.active },
      }),
    ]);
  } catch (error) {
    console.error('Error during quest decomposition:', error);
    await prisma.quest.update({
      where: { id: questId },
      data: { status: QuestStatus.failed },
    });
  }
}

type InvestigateJobData = {
  investigationId: string
  taskId: string
  prompt?: string | null
  modelType?: string | null
  images?: string[]
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

${promptSections.join('\n')}
${job.data.images?.length ? `\nThe user attached ${job.data.images.length} image(s); interpret them if supported by your model.\n` : ''}`;

  try {
    const { content, modelId } = await runModel(
      prompt,
      investigation.modelType ?? job.data.modelType,
      true,
      job.data.images,
    );
    console.log(`Investigation content (${modelId}):`, content);

    const result = parseJsonFromModel<{ summary?: string; details?: string }>(content);

    await prisma.taskInvestigation.update({
      where: { id: investigationId },
      data: {
        status: 'completed',
        summary: result?.summary ?? 'Investigation completed.',
        details: result?.details ?? '',
        error: null,
        modelType: modelId,
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
