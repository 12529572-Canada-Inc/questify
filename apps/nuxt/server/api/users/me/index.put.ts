import { Prisma, PrismaClient } from '@prisma/client'
import type { H3Event } from 'h3'
import type { ThemePreference } from 'shared'
import { isThemePreference } from 'shared'
import { attachSessionWithAccess, getUserAccessProfile } from '../../../utils/access-control'

const prisma = new PrismaClient()
const MAX_AVATAR_LENGTH = 1024 * 1024 // 1MB data-url cap to discourage huge payloads

interface UpdateProfileBody {
  name?: string | null
  email?: string | null
  avatarUrl?: string | null
  themePreference?: ThemePreference | null
}

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const sessionUser = session.user

  if (!sessionUser) {
    throw createError({ status: 401, statusText: 'Unauthorized' })
  }

  const body = await readBody<UpdateProfileBody | null>(event) ?? {}
  const data: Prisma.UserUpdateInput = {}

  if (body.name !== undefined) {
    const name = (body.name ?? '').trim()
    if (name.length > 120) {
      throw createError({ status: 400, statusText: 'Display name must be 120 characters or fewer.' })
    }
    data.name = name.length > 0 ? name : null
  }

  if (body.email !== undefined) {
    const email = (body.email ?? '').trim().toLowerCase()
    if (!isValidEmail(email)) {
      throw createError({ status: 400, statusText: 'A valid email address is required.' })
    }
    data.email = email
  }

  if (body.avatarUrl !== undefined) {
    const avatar = body.avatarUrl?.trim() ?? null

    if (avatar && !isValidAvatar(avatar)) {
      throw createError({
        status: 400,
        statusText: 'Avatar must be an HTTPS URL or data URI under 1MB.',
      })
    }

    data.avatarUrl = avatar
  }

  if (body.themePreference !== undefined && body.themePreference !== null) {
    if (!isThemePreference(body.themePreference)) {
      throw createError({ status: 400, statusText: 'Invalid theme preference.' })
    }
    data.themePreference = body.themePreference
  }
  else if (body.themePreference === null) {
    data.themePreference = 'light'
  }

  if (Object.keys(data).length === 0) {
    return currentProfile(sessionUser.id)
  }

  try {
    const updated = await prisma.user.update({
      where: { id: sessionUser.id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        themePreference: true,
      },
    })

    const profile = await attachSessionWithAccess(event as unknown as H3Event, {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      avatarUrl: updated.avatarUrl,
      themePreference: updated.themePreference,
    }, { includeProviders: true })

    return {
      success: true,
      user: {
        ...updated,
        roles: profile.roles,
        privileges: profile.privileges,
        providers: profile.providers ?? sessionUser.providers ?? [],
      },
    }
  }
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw createError({ status: 409, statusText: 'Email address is already in use.' })
    }
    throw error
  }
})

function isValidEmail(email: string) {
  if (!email) {
    return false
  }
  // Basic RFC5322-inspired check - avoids dependency on third-party validator.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidAvatar(avatar: string) {
  if (avatar.length > MAX_AVATAR_LENGTH) {
    return false
  }

  if (avatar.startsWith('data:image/')) {
    return true
  }

  try {
    const url = new URL(avatar)
    return url.protocol === 'https:'
  }
  catch {
    return false
  }
}

async function currentProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      themePreference: true,
    },
  })

  if (!user) {
    throw createError({ status: 404, statusText: 'User not found' })
  }

  const providers = await prisma.oAuthAccount.findMany({
    where: { userId },
    select: { provider: true },
  }).then(rows => rows.map(row => row.provider))

  const access = await getUserAccessProfile(userId)

  return {
    success: true,
    user: {
      ...user,
      providers,
      roles: access.roles,
      privileges: access.privileges,
    },
  }
}
