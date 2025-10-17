declare interface TaskQueue {
  add: (type: 'investigate-task', data: {
    investigationId: string
    taskId: string
  }) => Promise<void>
}
