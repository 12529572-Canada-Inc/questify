import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as shared from 'shared';

const workerInstance = {};
const WorkerMock = vi.fn(() => workerInstance);
const parseJsonFromModelMock = vi.fn();
const taskCreateMock = vi.fn();
const questUpdateMock = vi.fn();
const PrismaClientMock = vi.fn(() => ({
  task: { create: taskCreateMock },
  quest: { update: questUpdateMock },
}));
const openAiCreateMock = vi.fn();
const OpenAIMock = vi.fn(() => ({
  chat: { completions: { create: openAiCreateMock } },
}));
const configMock = {
  openaiApiKey: 'test-openai-key',
  redisHost: 'fallback-host',
  redisPort: 6380,
  redisPassword: 'fallback-pass',
  redisUrl: '',
  redisTls: false,
  databaseUrl: 'postgres://example',
};

vi.mock('bullmq', () => ({
  Worker: WorkerMock,
}));
vi.mock('../src/helpers.js', () => ({
  parseJsonFromModel: parseJsonFromModelMock,
}));
vi.mock('@prisma/client', () => ({
  PrismaClient: PrismaClientMock,
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
    PrismaClientMock.mockClear();
    openAiCreateMock.mockReset();
    OpenAIMock.mockClear();
    Object.assign(configMock, {
      openaiApiKey: 'test-openai-key',
      redisHost: 'fallback-host',
      redisPort: 6380,
      redisPassword: 'fallback-pass',
      redisUrl: '',
      redisTls: false,
      databaseUrl: 'postgres://example',
    });
  });

  it('uses fallback redis configuration when URL parsing fails', async () => {
    configMock.redisTls = true;

    await importWorker();

    expect(WorkerMock).toHaveBeenCalledTimes(1);
    const workerArgs = WorkerMock.mock.calls[0];
    expect(workerArgs[0]).toBe('quests');
    expect(workerArgs[2]).toEqual({
      connection: {
        host: 'fallback-host',
        port: 6380,
        password: 'fallback-pass',
        tls: {},
      },
    });
  });

  it('prefers the parsed redis configuration when available', async () => {
    configMock.redisUrl = 'redis://url-host:1234';

    await importWorker();

    expect(WorkerMock).toHaveBeenCalledTimes(1);
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

    const workerArgs = WorkerMock.mock.calls[0];
    const processor = workerArgs[1];
    const job = {
      name: 'decompose',
      data: {
        questId: 'quest-1',
        title: 'Quest Title',
        description: 'Quest Description',
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
      data: { status: 'active' },
    });
  });

  it('marks quests as failed when decomposition throws', async () => {
    configMock.redisUrl = 'redis://redis-host:6379';
    openAiCreateMock.mockRejectedValue(new Error('openai failure'));

    await importWorker();

    const workerArgs = WorkerMock.mock.calls[0];
    const processor = workerArgs[1];
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
      data: { status: 'failed' },
    });
    expect(errorSpy).toHaveBeenCalledWith(
      'Error during quest decomposition:',
      expect.any(Error),
    );

    errorSpy.mockRestore();
  });
});
