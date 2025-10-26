import { PrismaClient, QuestStatus } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ status: 400, statusText: 'Quest id is required' })
  }

  const quest = await prisma.quest.findUnique({
    where: { id },
    select: { ownerId: true, deletedAt: true },
  })

  if (!quest) {
    throw createError({ status: 404, statusText: 'Quest not found' })
  }

  if (quest.deletedAt) {
    throw createError({ status: 404, statusText: 'Quest not found' })
  }

  if (quest.ownerId !== user.id) {
    throw createError({ status: 403, statusText: 'You do not have permission to modify this quest' })
  }

  const body = (await readBody<QuestBody>(event)) || {} as QuestBody
  const { status, isPublic } = body

  // Validate that at least one field is being updated
  if (status === undefined && isPublic === undefined) {
    throw createError({ status: 400, statusText: 'At least one field (status or isPublic) is required' })
  }

  // Prepare update data
  const updateData: { status?: QuestStatus, isPublic?: boolean } = {}
  let normalizedStatus: QuestStatus | undefined

  // Validate and add status if provided
  if (status !== undefined) {
    if (typeof status !== 'string') {
      throw createError({ status: 400, statusText: 'Invalid quest status' })
    }

    const allowedStatuses: QuestStatus[] = [
      QuestStatus.draft,
      QuestStatus.active,
      QuestStatus.completed,
      QuestStatus.failed,
    ]

    if (!allowedStatuses.includes(status as QuestStatus)) {
      throw createError({ status: 400, statusText: 'Invalid quest status' })
    }

    normalizedStatus = status as QuestStatus
    updateData.status = normalizedStatus
  }

  // Validate and add isPublic if provided
  if (isPublic !== undefined) {
    if (typeof isPublic !== 'boolean') {
      throw createError({ status: 400, statusText: 'isPublic must be a boolean' })
    }

    updateData.isPublic = isPublic
  }

  // Handle status changes that affect tasks
  if (normalizedStatus === QuestStatus.completed) {
    // Transaction: complete quest + all tasks
    const [updatedQuest] = await prisma.$transaction([
      prisma.quest.update({
        where: { id },
        data: updateData,
      }),
      prisma.task.updateMany({
        where: { questId: id },
        data: { status: 'completed' },
      }),
    ])

    return updatedQuest
  }

  if (normalizedStatus === QuestStatus.draft || normalizedStatus === QuestStatus.active) {
    const [updatedQuest] = await prisma.$transaction([
      prisma.quest.update({
        where: { id },
        data: updateData,
      }),
      prisma.task.updateMany({
        where: { questId: id, status: 'completed' },
        data: { status: 'todo' },
      }),
    ])

    return updatedQuest
  }

  // Fallback for updates that don't impact task completion
  return prisma.quest.update({
    where: { id },
    data: updateData,
  })
})
