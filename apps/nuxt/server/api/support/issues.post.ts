import { createGithubIssue } from '../../utils/github'

const ISSUE_CATEGORIES = ['Bug', 'Feature Request', 'Question'] as const
type IssueCategory = typeof ISSUE_CATEGORIES[number]

type SubmitIssueBody = {
  title?: string
  category?: IssueCategory
  description?: string
  route?: string
}

type SessionUser = {
  id: string
  name?: string | null
  email?: string | null
}

const MAX_TITLE_LENGTH = 140
const MAX_ROUTE_LENGTH = 240
const MAX_DESCRIPTION_LENGTH = 6000

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const body = await readBody<SubmitIssueBody | null>(event) ?? {}

  const title = sanitizeTitle(body.title)
  const category = sanitizeCategory(body.category)
  const description = sanitizeDescription(body.description)
  const routePath = sanitizeRoute(body.route)

  const issueBody = formatIssueBody({
    category,
    description,
    routePath,
    user: session.user as SessionUser,
  })

  const issue = await createGithubIssue(event, {
    title,
    body: issueBody,
    labels: [category],
  })

  return {
    success: true,
    issue: {
      number: issue.number,
      title: issue.title ?? title,
      url: issue.html_url ?? issue.url ?? '',
    },
  }
})

function clampLength(value: string, max: number) {
  if (value.length <= max) {
    return value
  }
  return `${value.slice(0, Math.max(0, max - 3))}...`
}

function sanitizeTitle(value: unknown) {
  if (typeof value !== 'string') {
    throw createError({ status: 400, statusText: 'Issue title is required.' })
  }

  const trimmed = value.trim()
  if (!trimmed) {
    throw createError({ status: 400, statusText: 'Issue title cannot be empty.' })
  }

  return clampLength(trimmed, MAX_TITLE_LENGTH)
}

function sanitizeCategory(value: unknown): IssueCategory {
  if (typeof value !== 'string') {
    throw createError({ status: 400, statusText: 'Issue category is required.' })
  }

  const normalized = value.trim()
  if (ISSUE_CATEGORIES.includes(normalized as IssueCategory)) {
    return normalized as IssueCategory
  }

  throw createError({ status: 400, statusText: 'Invalid issue category.' })
}

function sanitizeDescription(value: unknown) {
  if (typeof value !== 'string') {
    return ''
  }
  return clampLength(value.trim(), MAX_DESCRIPTION_LENGTH)
}

function sanitizeRoute(value: unknown) {
  if (typeof value !== 'string') {
    return 'Unknown'
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return 'Unknown'
  }

  return clampLength(trimmed, MAX_ROUTE_LENGTH)
}

function formatIssueBody(options: {
  category: IssueCategory
  description: string
  routePath: string
  user: SessionUser
}) {
  const reporter = options.user.name?.trim()
    || options.user.email?.trim()
    || `User ${options.user.id}`

  const details = [
    `**Category:** ${options.category}`,
    `**Reporter:** ${reporter}`,
    `**User ID:** ${options.user.id}`,
    `**Page:** ${options.routePath}`,
    `**Submitted:** ${new Date().toISOString()}`,
    '',
    '### Description',
    options.description || '_No additional details provided._',
    '',
    '> Submitted via Questify Support Assistant.',
  ]

  return details.join('\n')
}
