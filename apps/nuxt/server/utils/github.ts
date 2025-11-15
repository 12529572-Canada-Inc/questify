type RuntimeConfigEvent = Parameters<typeof useRuntimeConfig>[0]

type GithubConfig = {
  owner: string
  repo: string
  token: string
}

export type GithubIssueInput = {
  title: string
  body: string
  labels?: string[]
}

export type GithubIssueResponse = {
  number: number
  html_url?: string
  url?: string
  title?: string
}

function normalizeConfigValue(value?: string | null) {
  return typeof value === 'string' ? value.trim() : ''
}

function resolveGithubConfig(event: RuntimeConfigEvent): GithubConfig {
  const runtimeConfig = useRuntimeConfig(event)
  const github = runtimeConfig.github ?? {}

  const owner = normalizeConfigValue(github.owner)
  const repo = normalizeConfigValue(github.repo)
  const token = normalizeConfigValue(github.token)

  if (!owner || !repo || !token) {
    throw createError({
      status: 503,
      statusText: 'Issue submission is not configured for this environment.',
    })
  }

  return { owner, repo, token }
}

export async function createGithubIssue(event: RuntimeConfigEvent, input: GithubIssueInput) {
  const { owner, repo, token } = resolveGithubConfig(event)
  const payload: Record<string, unknown> = {
    title: input.title,
    body: input.body,
  }

  if (input.labels?.length) {
    payload.labels = input.labels
  }

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    headers: {
      'accept': 'application/vnd.github+json',
      'content-type': 'application/json',
      'authorization': `Bearer ${token}`,
      'user-agent': 'Questify Support Assistant',
    },
    body: JSON.stringify(payload),
  })

  const rawBody = await response.text()
  let data: GithubIssueResponse | null = null

  if (rawBody.length > 0) {
    try {
      data = JSON.parse(rawBody)
    }
    catch {
      // allow error handling below to surface the raw response text
    }
  }

  if (!response.ok || !data) {
    const message = (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string')
      ? data.message
      : rawBody || response.statusText || 'Unknown error'

    throw createError({
      status: 502,
      statusText: `GitHub issue creation failed: ${message}`,
    })
  }

  return data
}
