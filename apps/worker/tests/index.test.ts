import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as shared from 'shared/server';

const workerInstance = {};
const WorkerMock = vi.fn(() => workerInstance);
const parseJsonFromModelMock = vi.fn();
const taskCreateMock = vi.fn();
const questUpdateMock = vi.fn();
const taskInvestigationFindUniqueMock = vi.fn();
const taskInvestigationUpdateMock = vi.fn();
const PrismaClientMock = vi.fn(() => ({
  task: { create: taskCreateMock },
  quest: { update: questUpdateMock },
  taskInvestigation: {
    findUnique: taskInvestigationFindUniqueMock,
    update: taskInvestigationUpdateMock,
  },
}));
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

const QUEST_STATUS = {
  active: 'active',
  failed: 'failed',
} as const;

const originalFetch = globalThis.fetch;
const parseJsonSpy = vi.spyOn(shared, 'parseJsonFromModel');

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
  parseJsonSpy.mockRestore();
});

vi.mock('bullmq', () => ({
  Worker: WorkerMock,
}));
vi.mock('@prisma/client', () => ({
  PrismaClient: PrismaClientMock,
  QuestStatus: QUEST_STATUS,
}));
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
    taskCreateMock.mockReset();
    questUpdateMock.mockReset();
    taskInvestigationFindUniqueMock.mockReset();
    taskInvestigationUpdateMock.mockReset();
    PrismaClientMock.mockClear();
    openAiCreateMock.mockReset();
    OpenAIMock.mockClear();
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
    parseJsonSpy.mockImplementation(parseJsonFromModelMock);
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
          content: expect.stringContaining('Quest Title: Quest Title'),
        },
      ],
    });
    expect(parseJsonFromModelMock).toHaveBeenCalledWith('model-content');
    expect(taskCreateMock).toHaveBeenNthCalledWith(1, {
      data: {
        questId: 'quest-1',
        title: 'Task 1',
        details: 'Do something',
        order: 0,
      },
    });
    expect(taskCreateMock).toHaveBeenNthCalledWith(2, {
      data: {
        questId: 'quest-1',
        title: 'Task 2',
        details: 'Do another thing',
        order: 1,
      },
    });
    expect(questUpdateMock).toHaveBeenCalledWith({
      where: { id: 'quest-1' },
      data: { status: QUEST_STATUS.active },
    });
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

    expect(taskCreateMock).not.toHaveBeenCalled();
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

    expect(taskCreateMock).toHaveBeenNthCalledWith(1, {
      data: {
        questId: 'quest-3',
        title: 'Task 1',
        details: null,
        order: 0,
      },
    });
    expect(taskCreateMock).toHaveBeenNthCalledWith(2, {
      data: {
        questId: 'quest-3',
        title: 'Task 2',
        details: null,
        order: 1,
      },
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
});
