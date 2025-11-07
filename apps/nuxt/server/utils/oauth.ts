import type { H3Event } from 'h3'
import type { OAuthProvider } from 'shared'
import { SUPPORTED_OAUTH_PROVIDERS } from 'shared'
import { prisma } from 'shared/server'
import { attachSessionWithAccess } from './access-control'

export interface NormalizedOAuthProfile {
  id: string
  email?: string | null
  name?: string | null
  avatarUrl?: string | null
}

export interface OAuthTokenPayload {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  expires_at?: number
  [key: string]: unknown
}

export type OAuthSuccessAction = 'linked' | 'signed-in' | 'created'

export interface OAuthSuccessResult {
  action: OAuthSuccessAction
  provider: OAuthProvider
  user: {
    id: string
    email: string
    name: string | null
    avatarUrl: string | null
  }
}

export async function handleOAuthSuccess(
  event: H3Event,
  provider: OAuthProvider,
  profile: NormalizedOAuthProfile,
  tokens: OAuthTokenPayload,
): Promise<OAuthSuccessResult> {
  if (!SUPPORTED_OAUTH_PROVIDERS.includes(provider)) {
    throw createError({ status: 400, statusText: 'Unsupported provider' })
  }

  if (!profile.id) {
    throw createError({ status: 500, statusText: 'Missing provider id' })
  }

  const session = await getUserSession(event)
  const sessionUser = session?.user

  const providerKey = profile.id
  const providerUniqueWhere = {
    provider_providerAccountId: {
      provider,
      providerAccountId: providerKey,
    },
  } as const

  const existingAccount = await prisma.oAuthAccount.findUnique({
    where: providerUniqueWhere,
    include: { user: true },
  })

  // Update tokens when the account already exists
  if (existingAccount) {
    if (sessionUser && existingAccount.userId !== sessionUser.id) {
      throw createError({
        status: 409,
        statusText: 'This OAuth account is already linked to a different Questify user.',
      })
    }

    await prisma.oAuthAccount.update({
      where: { id: existingAccount.id },
      data: mapTokensForUpdate(tokens),
    })

    let linkedUser = existingAccount.user

    if (profile.avatarUrl && profile.avatarUrl !== linkedUser.avatarUrl) {
      linkedUser = await prisma.user.update({
        where: { id: linkedUser.id },
        data: { avatarUrl: profile.avatarUrl },
      })
    }

    // Refresh session to include the latest provider list
    const action: OAuthSuccessAction = sessionUser ? 'linked' : 'signed-in'
    await attachSessionWithAccess(event, {
      id: linkedUser.id,
      email: linkedUser.email,
      name: linkedUser.name,
      avatarUrl: linkedUser.avatarUrl,
      themePreference: linkedUser.themePreference,
    }, { includeProviders: true })
    setOAuthResultCookie(event, provider, action)

    return {
      action,
      provider,
      user: {
        id: linkedUser.id,
        email: linkedUser.email,
        name: linkedUser.name ?? null,
        avatarUrl: linkedUser.avatarUrl ?? null,
      },
    }
  }

  const linkageTargetUser = sessionUser
    ? await prisma.user.findUnique({ where: { id: sessionUser.id } })
    : await findUserByProfileEmail(profile.email)

  let user = linkageTargetUser

  if (!user) {
    if (!profile.email) {
      throw createError({
        status: 400,
        statusText: `Unable to create account: ${provider} did not supply an email address.`,
      })
    }

    user = await prisma.user.create({
      data: {
        email: profile.email.toLowerCase(),
        name: profile.name ?? null,
        avatarUrl: profile.avatarUrl ?? null,
      },
    })
  }
  else {
    const updates: {
      name?: string
      avatarUrl?: string | null
    } = {}

    if (!user.name && profile.name) {
      updates.name = profile.name
    }

    if (profile.avatarUrl && profile.avatarUrl !== user.avatarUrl) {
      updates.avatarUrl = profile.avatarUrl
    }

    if (Object.keys(updates).length > 0) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: updates,
      })
    }
  }

  await prisma.oAuthAccount.create({
    data: {
      provider,
      providerAccountId: providerKey,
      userId: user.id,
      ...mapTokensToAccount(tokens),
    },
  })

  const action: OAuthSuccessAction = sessionUser ? 'linked' : 'created'
  await attachSessionWithAccess(event, {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    themePreference: user.themePreference,
  }, { includeProviders: true })
  setOAuthResultCookie(event, provider, action)

  return {
    action,
    provider,
    user: {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      avatarUrl: user.avatarUrl ?? null,
    },
  }
}

async function findUserByProfileEmail(email?: string | null) {
  if (!email) {
    return null
  }

  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })
}

function mapTokensToAccount(tokens: OAuthTokenPayload) {
  const expiresAt = deriveExpiry(tokens)

  return {
    accessToken: tokens.access_token ?? null,
    refreshToken: tokens.refresh_token ?? null,
    expiresAt,
  }
}

/**
 * Maps OAuth tokens for updating an existing account.
 * Only includes refresh token if a new one is provided to avoid
 * overwriting stored tokens when providers omit them on subsequent logins.
 */
function mapTokensForUpdate(tokens: OAuthTokenPayload) {
  const expiresAt = deriveExpiry(tokens)
  const data: {
    accessToken: string | null
    refreshToken?: string | null
    expiresAt: Date | null
  } = {
    accessToken: tokens.access_token ?? null,
    expiresAt,
  }

  // Only update refresh token if provider supplied a new one
  if (tokens.refresh_token !== undefined) {
    data.refreshToken = tokens.refresh_token
  }

  return data
}

function deriveExpiry(tokens: OAuthTokenPayload) {
  if (typeof tokens.expires_at === 'number') {
    const timestamp = tokens.expires_at > 1e12 ? tokens.expires_at : tokens.expires_at * 1000
    return new Date(timestamp)
  }

  if (typeof tokens.expires_in === 'number') {
    return new Date(Date.now() + (tokens.expires_in * 1000))
  }

  return null
}

function setOAuthResultCookie(event: H3Event, provider: OAuthProvider, action: OAuthSuccessAction) {
  // @ts-expect-error - H3Event type mismatch between imported type and auto-import function
  setCookie(event, 'oauth_result', JSON.stringify({ provider, action }), {
    path: '/',
    maxAge: 60,
    sameSite: 'lax',
  })
}
