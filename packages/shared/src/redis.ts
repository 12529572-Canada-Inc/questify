export function parseRedisUrl(url?: string) {
  if (!url) return null

  try {
    const parsed = new URL(url)

    const defaultPort = 6379
    const parsedPort = parsed.port !== "" ? Number(parsed.port) : Number.NaN
    const port = Number.isNaN(parsedPort) ? defaultPort : parsedPort

    return {
      host: parsed.hostname,
      port,
      password: parsed.password || undefined,
      tls: parsed.protocol === 'rediss:' ? {} : undefined,
    }
  }
  catch {
    return null
  }
}