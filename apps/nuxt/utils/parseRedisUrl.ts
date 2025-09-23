export function parseRedisUrl(url?: string) {
  if (!url) return null

  try {
    const parsed = new URL(url)

    return {
      host: parsed.hostname,
      port: Number(parsed.port),
      password: parsed.password || undefined,
      tls: parsed.protocol === 'rediss:' ? {} : undefined,
    }
  }
  catch {
    return null
  }
}
