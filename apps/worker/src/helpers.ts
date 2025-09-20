export function parseJsonFromModel(content: string) {
  if (!content) return [];

  // Remove ```json and ``` if present
  const cleaned = content
    .trim()
    .replace(/^```json\s*/, '')
    .replace(/```$/, '')
    .replace(/\\n/g, '\n'); // optional: unescape newlines

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Failed to parse JSON from response:', cleaned);
    throw err;
  }
}
