declare interface TaskQueue {
  add: (type: 'investigate-task', data: {
    investigationId: string
    taskId: string
    prompt?: string | null
    modelType: string
  }) => Promise<void>
}
