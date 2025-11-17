import { vi } from 'vitest'

type Base = Record<string, unknown>

export function createQuest(overrides: Base = {}) {
  return {
    id: 'quest-1',
    title: 'Launch Quest',
    status: 'draft' as const,
    modelType: 'gpt-4o-mini',
    goal: 'Ship the new feature',
    context: 'Work with the product team to coordinate rollout.',
    constraints: 'Must launch by Friday.',
    isPublic: false,
    ownerId: 'user-1',
    owner: { id: 'user-1', name: 'Quest Owner', email: 'owner@example.com' },
    images: [],
    createdAt: new Date(0),
    updatedAt: new Date(0),
    deletedAt: null,
    ...overrides,
  }
}

export function createInvestigation(overrides: Base = {}) {
  return {
    id: 'inv-1',
    taskId: 'task-1',
    status: 'completed',
    modelType: 'gpt-4o-mini',
    summary: 'Summary of findings',
    details: 'Detailed insight and next steps.',
    prompt: 'Investigate blockers',
    error: null,
    images: [],
    createdAt: new Date(0),
    updatedAt: new Date(0),
    initiatedById: 'user-1',
    initiatedBy: { id: 'user-1', name: 'Quest Owner', email: 'owner@example.com' },
    ...overrides,
  }
}

export function createTask(overrides: Base = {}) {
  return {
    id: 'task-1',
    questId: 'quest-1',
    title: 'Prepare launch checklist',
    status: 'todo',
    order: 0,
    details: 'Draft the checklist for the launch tasks.',
    extraContent: 'Include QA and marketing items.',
    images: [],
    createdAt: new Date(0),
    updatedAt: new Date(0),
    investigations: [createInvestigation()],
    ...overrides,
  }
}

export function createTaskSection(overrides: Base = {}) {
  return {
    value: 'todo',
    title: 'To Do',
    color: 'primary',
    tasks: [createTask()],
    completed: false,
    emptyMessage: 'No tasks yet',
    action: {
      label: 'Mark Complete',
      color: 'success',
      handler: vi.fn(),
    },
    ...overrides,
  }
}
