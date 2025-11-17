import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const loadModelConfigMock = vi.hoisted(() => vi.fn());

const sharedMocks = vi.hoisted(() => {
  const QUEST_STATUS = {
    active: 'active',
    failed: 'failed',
  } as const;
  const parseJsonFromModelMock = vi.fn();
  const taskDeleteManyMock = vi.fn();
  const taskCreateManyMock = vi.fn();
  const questUpdateMock = vi.fn();
  const taskInvestigationFindUniqueMock = vi.fn();
  const taskInvestigationUpdateMock = vi.fn();
  const transactionMock = vi.fn(async (operations: Promise<unknown>[]) => {
    await Promise.all(operations);
  });
  const prismaMock = {
    task: {
      deleteMany: taskDeleteManyMock,
      createMany: taskCreateManyMock,
    },
    quest: { update: questUpdateMock },
    taskInvestigation: {
      findUnique: taskInvestigationFindUniqueMock,
      update: taskInvestigationUpdateMock,
    },
    $transaction: transactionMock,
  };

  return {
    QUEST_STATUS,
    parseJsonFromModelMock,
    taskDeleteManyMock,
    taskCreateManyMock,
    questUpdateMock,
    taskInvestigationFindUniqueMock,
    taskInvestigationUpdateMock,
    transactionMock,
    prismaMock,
  };
});

const {
  QUEST_STATUS,
  parseJsonFromModelMock,
  taskDeleteManyMock,
  taskCreateManyMock,
  questUpdateMock,
  taskInvestigationFindUniqueMock,
  taskInvestigationUpdateMock,
  transactionMock,
  prismaMock,
} = sharedMocks;

vi.mock('shared/server', async () => {
  const actual = await vi.importActual<typeof import('shared/server')>('shared/server');
  return {
    ...actual,
    loadModelConfig: loadModelConfigMock,
    parseJsonFromModel: sharedMocks.parseJsonFromModelMock,
    prisma: sharedMocks.prismaMock,
  };
});

import * as shared from 'shared/server';
const originalParseJsonFromModel = shared.parseJsonFromModel;

const workerInstance = {};
const WorkerMock = vi.fn(() => workerInstance);
const openAiCreateMock = vi.fn();
const OpenAIMock = vi.fn(() => ({
  chat: { completions: { create: openAiCreateMock } },
}));
const configMock = {
  openaiApiKey: 'test-openai-key',
  anthropicApiKey: '',
  anthropicApiVersion: '2023-06-01',
  deepseekApiKey: '',
  deepseekBaseUrl: 'https://api.deepseek.com/v1',
  redisHost: 'fallback-host',
  redisPort: 6380,
  redisPassword: 'fallback-pass',
  redisUrl: '',
  redisTls: false,
  databaseUrl: 'postgres://example',
};

const originalFetch = globalThis.fetch;
beforeAll(() => {
  if (!globalThis.fetch) {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ content: [] }),
      text: async () => '',
    })) as unknown as typeof fetch;
  }
});

afterAll(() => {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  }
  else {
    Reflect.deleteProperty(globalThis as typeof globalThis & { fetch?: typeof fetch }, 'fetch');
  }
});

vi.mock('bullmq', () => ({
  Worker: WorkerMock,
}));
vi.mock('@prisma/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@prisma/client')>();
  return {
    ...actual,
    QuestStatus: sharedMocks.QUEST_STATUS,
  };
});
vi.mock('openai', () => ({
  default: OpenAIMock,
}));
vi.mock('../src/config.js', () => ({
  config: configMock,
}));

async function importWorker() {
  await import('../src/index.js');
}

describe('worker entrypoint', () => {
  beforeEach(() => {
    vi.resetModules();
    WorkerMock.mockClear();
    parseJsonFromModelMock.mockReset();
    taskDeleteManyMock.mockReset();
    taskDeleteManyMock.mockResolvedValue(undefined);
    taskCreateManyMock.mockReset();
    taskCreateManyMock.mockResolvedValue(undefined);
    questUpdateMock.mockReset();
    questUpdateMock.mockResolvedValue(undefined);
    taskInvestigationFindUniqueMock.mockReset();
    taskInvestigationUpdateMock.mockReset();
    transactionMock.mockReset();
    transactionMock.mockImplementation(async (operations: Promise<unknown>[]) => {
      await Promise.all(operations ?? []);
    });
    openAiCreateMock.mockReset();
    OpenAIMock.mockClear();
    loadModelConfigMock.mockReset();
    loadModelConfigMock.mockReturnValue({
      models: [{
        id: 'gpt-4o-mini',
        label: 'GPT-4o mini',
        provider: 'openai',
        providerLabel: 'OpenAI',
        description: '',
        tags: [],
        apiModel: 'gpt-4o-mini',
        default: true,
      }],
      defaultModelId: 'gpt-4o-mini',
      source: 'default',
    });
    Object.assign(configMock, {
      openaiApiKey: 'test-openai-key',
      anthropicApiKey: '',
      anthropicApiVersion: '2023-06-01',
      deepseekApiKey: '',
    deepseekBaseUrl: 'https://api.deepseek.com/v1',
      redisHost: 'fallback-host',
      redisPort: 6380,
      redisPassword: 'fallback-pass',
      redisUrl: '',
      redisTls: false,
      databaseUrl: 'postgres://example',
    });
    (shared as typeof shared & { parseJsonFromModel: typeof originalParseJsonFromModel }).parseJsonFromModel =
      parseJsonFromModelMock as unknown as typeof originalParseJsonFromModel;
  });

  it('uses fallback redis configuration when URL parsing fails', async () => {
    configMock.redisTls = true;

    await importWorker();

    expect(WorkerMock).toHaveBeenCalledTimes(2);
    const [questWorkerArgs, taskWorkerArgs] = WorkerMock.mock.calls;
    expect(questWorkerArgs[0]).toBe('quests');
    expect(questWorkerArgs[2]).toEqual({
      connection: {
        host: 'fallback-host',
        port: 6380,
        password: 'fallback-pass',
        tls: {},
      },
    });
    expect(taskWorkerArgs[0]).toBe('tasks');
    expect(taskWorkerArgs[2]).toEqual(questWorkerArgs[2]);
  });

  it('prefers the parsed redis configuration when available', async () => {
    configMock.redisUrl = 'redis://url-host:1234';

    await importWorker();

    expect(WorkerMock).toHaveBeenCalledTimes(2);
    const workerArgs = WorkerMock.mock.calls[0];
    expect(workerArgs[2]).toEqual({
      connection: shared.parseRedisUrl('redis://url-host:1234'),
    });
  });

  it('processes decompose jobs and stores generated tasks', async () => {
    configMock.redisUrl = 'redis://redis-host:6379';
    const tasks = [
      { title: 'Task 1', details: 'Do something' },
      { title: 'Task 2', details: 'Do another thing' },
    ];
    parseJsonFromModelMock.mockReturnValue(tasks);
    openAiCreateMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: 'model-content',
          },
        },
      ],
    });

    await importWorker();

    const processor = WorkerMock.mock.calls[0][1];
    const job = {
      name: 'decompose',
      data: {
        questId: 'quest-1',
        title: 'Quest Title',
        goal: 'Quest Goal',
        context: 'Quest Context',
        constraints: 'Quest Constraints',
      },
    };

    await processor(job);

    expect(OpenAIMock).toHaveBeenCalledWith({ apiKey: 'test-openai-key' });
    expect(openAiCreateMock).toHaveBeenCalledWith({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: expect.arrayContaining([
            expect.objectContaining({ text: expect.stringContaining('Quest Title: Quest Title') }),
          ]),
        },
      ],
    });
    expect(parseJsonFromModelMock).toHaveBeenCalledWith('model-content');
    expect(taskDeleteManyMock).toHaveBeenCalledWith({ where: { questId: 'quest-1' } });
    expect(taskCreateManyMock).toHaveBeenCalledWith({
      data: [
        {
          questId: 'quest-1',
          title: 'Task 1',
          details: 'Do something',
          order: 0,
        },
        {
          questId: 'quest-1',
          title: 'Task 2',
          details: 'Do another thing',
          order: 1,
        },
      ],
    });
    expect(questUpdateMock).toHaveBeenCalledWith({
      where: { id: 'quest-1' },
      data: { status: QUEST_STATUS.active },
    });
  });

  it('handles quest decomposition with image attachments (OpenAI multimodal)', async () => {
    parseJsonFromModelMock.mockReturnValue([]);
    openAiCreateMock.mockResolvedValue({
      choices: [{ message: { content: '[]' } }],
    });

    await importWorker();
    const processor = WorkerMock.mock.calls[0][1];
    const job = {
      name: 'decompose',
      data: {
        questId: 'quest-2',
        title: 'Quest With Images',
        goal: 'Quest Goal',
        context: 'Quest Context',
        constraints: 'Quest Constraints',
        images: ['data:image/png;base64,abc123'],
      },
    };

    await processor(job as never);

    expect(openAiCreateMock).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gpt-4o-mini',
      messages: [
        expect.objectContaining({
          role: 'user',
          content: expect.arrayContaining([
            expect.objectContaining({ type: 'image_url' }),
          ]),
        }),
      ],
    }));
  });

  it('routes deepseek models through the deepseek client', async () => {
    loadModelConfigMock.mockReturnValue({
      models: [{
        id: 'deepseek-chat',
        label: 'DeepSeek',
        provider: 'deepseek',
        providerLabel: 'DeepSeek',
        description: '',
        tags: [],
        apiModel: 'deepseek-chat',
        default: true,
      }],
      defaultModelId: 'deepseek-chat',
      source: 'default',
    });
    Object.assign(configMock, {
      openaiApiKey: '',
      deepseekApiKey: 'deepseek-key',
    });
    parseJsonFromModelMock.mockReturnValue([]);
    openAiCreateMock.mockResolvedValue({
      choices: [{ message: { content: '[]' } }],
    });

    await importWorker();
    const processor = WorkerMock.mock.calls[0][1];

    await processor({
      name: 'decompose',
      data: {
        questId: 'quest-deepseek',
        title: 'Deepseek Quest',
        goal: null,
        context: null,
        constraints: null,
        images: ['https://example.com/image.png'],
      },
    } as never);

    expect(openAiCreateMock).toHaveBeenCalledTimes(1);
    expect(openAiCreateMock).toHaveBeenCalledWith(expect.objectContaining({
      model: 'deepseek-chat',
    }));
  });

  it('uses anthropic models when configured', async () => {
    loadModelConfigMock.mockReturnValue({
      models: [{
        id: 'claude-3',
        label: 'Claude',
        provider: 'anthropic',
        providerLabel: 'Anthropic',
        description: '',
        tags: [],
        apiModel: 'claude-3',
        default: true,
      }],
      defaultModelId: 'claude-3',
      source: 'default',
    });
    Object.assign(configMock, {
      openaiApiKey: '',
      deepseekApiKey: '',
      anthropicApiKey: 'anthropic-key',
    });
    parseJsonFromModelMock.mockReturnValue([]);
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ text: '[]' }] }),
      text: async () => '',
    } as unknown as Response);

    await importWorker();
    const processor = WorkerMock.mock.calls[0][1];

    await processor({
      name: 'decompose',
      data: {
        questId: 'quest-claude',
        title: 'Claude Quest',
        images: ['https://example.com/attached.png'],
      },
    } as never);

    expect(fetchSpy).toHaveBeenCalledWith('https://api.anthropic.com/v1/messages', expect.any(Object));
  });

  it('marks quests as failed when decomposition throws', async () => {
    configMock.redisUrl = 'redis://redis-host:6379';
    openAiCreateMock.mockRejectedValue(new Error('openai failure'));

    await importWorker();

    const processor = WorkerMock.mock.calls[0][1];
    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await processor({
      name: 'decompose',
      data: { questId: 'quest-2' },
    });

    expect(taskCreateManyMock).not.toHaveBeenCalled();
    expect(taskDeleteManyMock).not.toHaveBeenCalled();
    expect(questUpdateMock).toHaveBeenCalledWith({
      where: { id: 'quest-2' },
      data: { status: QUEST_STATUS.failed },
    });
    expect(errorSpy).toHaveBeenCalledWith(
      'Error during quest decomposition:',
      expect.any(Error),
    );

    errorSpy.mockRestore();
  });

  it('fills in missing task fields with sensible defaults', async () => {
    configMock.redisUrl = 'redis://redis-host:6379';
    parseJsonFromModelMock.mockReturnValue([
      { title: '  ', details: '   ' },
      {},
    ]);
    openAiCreateMock.mockResolvedValue({
      choices: [{ message: { content: 'model-content' } }],
    });

    await importWorker();

    const processor = WorkerMock.mock.calls[0][1];
    await processor({
      name: 'decompose',
      data: { questId: 'quest-3', title: 'Quest Title' },
    });

    expect(taskCreateManyMock).toHaveBeenCalledWith({
      data: [
        {
          questId: 'quest-3',
          title: 'Task 1',
          details: null,
          order: 0,
        },
        {
          questId: 'quest-3',
          title: 'Task 2',
          details: null,
          order: 1,
        },
      ],
    });
  });

  it('ignores unknown quest job names', async () => {
    await importWorker();
    const processor = WorkerMock.mock.calls[0][1];
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await processor({ name: 'other-job' });

    expect(warnSpy).toHaveBeenCalledWith('Unknown quest job:', 'other-job');
    expect(openAiCreateMock).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('processes investigate-task jobs and stores investigation results', async () => {
    configMock.redisUrl = 'redis://redis-host:6379';
    parseJsonFromModelMock.mockReturnValue({
      summary: 'Key findings',
      details: 'Detailed analysis',
    });
    openAiCreateMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: 'investigation-content',
          },
        },
      ],
    });
    taskInvestigationFindUniqueMock.mockResolvedValue({
      id: 'inv-1',
      task: {
        title: 'Task Title',
        details: 'Task details',
        extraContent: 'Owner notes',
        quest: {
          title: 'Quest Title',
          goal: 'Quest Goal',
          context: 'Quest Context',
          constraints: 'Quest Constraints',
        },
      },
    });

    await importWorker();

    const processor = WorkerMock.mock.calls[1][1];
    await processor({
      name: 'investigate-task',
      data: { investigationId: 'inv-1' },
    });

    expect(taskInvestigationFindUniqueMock).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
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
    expect(parseJsonFromModelMock).toHaveBeenCalledWith('investigation-content');
    expect(taskInvestigationUpdateMock).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: {
        status: 'completed',
        summary: 'Key findings',
        details: 'Detailed analysis',
        error: null,
        modelType: 'gpt-4o-mini',
      },
    });
  });

  it('marks investigations as failed when OpenAI throws', async () => {
    configMock.redisUrl = 'redis://redis-host:6379';
    openAiCreateMock.mockRejectedValue(new Error('investigation failure'));
    taskInvestigationFindUniqueMock.mockResolvedValue({
      id: 'inv-1',
      task: {
        title: 'Task Title',
        details: null,
        extraContent: null,
        quest: {
          title: 'Quest Title',
          goal: null,
          context: null,
          constraints: null,
        },
      },
    });

    await importWorker();

    const processor = WorkerMock.mock.calls[1][1];
    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await processor({
      name: 'investigate-task',
      data: { investigationId: 'inv-1' },
    });

    expect(taskInvestigationUpdateMock).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: {
        status: 'failed',
        error: 'investigation failure',
      },
    });
    expect(errorSpy).toHaveBeenCalledWith(
      'Error during task investigation:',
      expect.any(Error),
    );

    errorSpy.mockRestore();
  });

  it('ignores investigate-task jobs without matching records', async () => {
    configMock.redisUrl = 'redis://redis-host:6379';
    taskInvestigationFindUniqueMock.mockResolvedValue(null);

    await importWorker();

    const processor = WorkerMock.mock.calls[1][1];
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await processor({
      name: 'investigate-task',
      data: { investigationId: 'missing' },
    });

    expect(taskInvestigationUpdateMock).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith('Task investigation record missing:', 'missing');

    warnSpy.mockRestore();
  });

  it('ignores unknown investigate-task job names', async () => {
    await importWorker();

    const processor = WorkerMock.mock.calls[1][1];
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await processor({ name: 'something-else' });

    expect(warnSpy).toHaveBeenCalledWith('Unknown task job:', 'something-else');
    expect(taskInvestigationFindUniqueMock).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('marks quests failed when OpenAI client is missing', async () => {
    Object.assign(configMock, { openaiApiKey: '' });
    parseJsonFromModelMock.mockReturnValue([]);

    await importWorker();
    const processor = WorkerMock.mock.calls[0][1];

    await processor({
      name: 'decompose',
      data: {
        questId: 'quest-missing-client',
        title: 'Quest Without Client',
      },
    } as never);

    expect(questUpdateMock).toHaveBeenCalledWith({
      where: { id: 'quest-missing-client' },
      data: { status: QUEST_STATUS.failed },
    });
  });

  it('falls back to default model when the requested provider is unavailable', async () => {
    loadModelConfigMock.mockReturnValue({
      models: [
        {
          id: 'gpt-4o-mini',
          label: 'GPT-4o mini',
          provider: 'openai',
          providerLabel: 'OpenAI',
          description: '',
          tags: [],
          apiModel: 'gpt-4o-mini',
          default: true,
        },
        {
          id: 'deepseek-chat',
          label: 'DeepSeek',
          provider: 'deepseek',
          providerLabel: 'DeepSeek',
          description: '',
          tags: [],
          apiModel: 'deepseek-chat',
          default: false,
        },
      ],
      defaultModelId: 'gpt-4o-mini',
      source: 'default',
    });
    Object.assign(configMock, {
      openaiApiKey: 'test-openai-key',
      deepseekApiKey: '',
    });
    parseJsonFromModelMock.mockReturnValue([]);
    openAiCreateMock.mockResolvedValue({
      choices: [{ message: { content: '[]' } }],
    });

    await importWorker();
    const processor = WorkerMock.mock.calls[0][1];

    await processor({
      name: 'decompose',
      data: {
        questId: 'quest-fallback',
        title: 'Quest Fallback',
        modelType: 'deepseek-chat',
      },
    } as never);

    expect(openAiCreateMock).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gpt-4o-mini',
    }));
  });

  it('fails fast when no models are configured', async () => {
    loadModelConfigMock.mockReturnValue({
      models: [],
      defaultModelId: 'none',
      source: 'default',
    });

    await expect(importWorker()).rejects.toThrow('No AI models configured');
  });

  it('marks quest failed when anthropic key is missing for anthropic model', async () => {
    loadModelConfigMock.mockReturnValue({
      models: [{
        id: 'claude-3',
        label: 'Claude',
        provider: 'anthropic',
        providerLabel: 'Anthropic',
        description: '',
        tags: [],
        apiModel: 'claude-3',
        default: true,
      }],
      defaultModelId: 'claude-3',
      source: 'default',
    });
    Object.assign(configMock, {
      openaiApiKey: '',
      deepseekApiKey: '',
      anthropicApiKey: '',
    });
    parseJsonFromModelMock.mockReturnValue([]);

    await importWorker();
    const processor = WorkerMock.mock.calls[0][1];

    await processor({
      name: 'decompose',
      data: {
        questId: 'quest-anthropic',
        title: 'Anthropic Missing Key',
      },
    } as never);

    expect(questUpdateMock).toHaveBeenCalledWith({
      where: { id: 'quest-anthropic' },
      data: { status: QUEST_STATUS.failed },
    });
  });
});
