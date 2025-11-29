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

  let cleaned = content.trim().replace(/\\n/g, '\n')

  // Prefer content inside a fenced block when the model wraps JSON
  const fenced = cleaned.match(/```(?:json)?\\s*([\\s\\S]*?)```/i)
  if (fenced?.[1]) {
    cleaned = fenced[1].trim()
  }
  else {
    // Otherwise, strip any leading commentary before the first JSON character
    const firstJsonIndex = cleaned.search(/[\\[{]/)
    if (firstJsonIndex > 0) {
      cleaned = cleaned.slice(firstJsonIndex)
    }
  }

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
