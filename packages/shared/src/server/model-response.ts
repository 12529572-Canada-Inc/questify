import { jsonrepair } from 'jsonrepair'

type JsonObject = Record<string, unknown>
type JsonShape = JsonObject | JsonObject[]

function ensureJsonShape(value: unknown): JsonShape {
  if (Array.isArray(value)) {
    return value as JsonObject[]
  }

  if (value && typeof value === 'object') {
    return value as JsonObject
  }

  throw new Error('Model response was not a JSON object or array')
}

export function parseJsonFromModel<T extends JsonShape>(content: string): T {
  if (!content) return [] as unknown as T

  const cleaned = content
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/```$/, '')
    .replace(/\\n/g, '\n')

  try {
    const parsed = JSON.parse(cleaned)
    return ensureJsonShape(parsed) as T
  }
  catch {
    try {
      const repaired = jsonrepair(cleaned)
      const parsed = JSON.parse(repaired)
      return ensureJsonShape(parsed) as T
    }
    catch (repairError) {
      console.error('Failed to parse JSON from response:', cleaned)
      throw repairError
    }
  }
}

