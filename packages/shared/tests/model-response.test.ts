import { describe, expect, it } from 'vitest'
import { parseJsonFromModel } from '../src/server/model-response'

describe('parseJsonFromModel', () => {
  it('extracts fenced JSON inside prose and returns objects', () => {
    const content = [
      'Here is the requested plan:',
      '```json',
      '[',
      '  { "title": "Task 1", "details": "Do something" }',
      ']',
      '```',
      'Thanks!',
    ].join('\n')

    expect(parseJsonFromModel(content)).toEqual([
      { title: 'Task 1', details: 'Do something' },
    ])
  })

  it('flattens a single nested array and removes empty artifacts', () => {
    const wrapped = JSON.stringify([[{ title: 'T', details: 'D' }], '', ''])
    const result = parseJsonFromModel(wrapped) as Array<{ title: string; details: string }>

    expect(result).toEqual([{ title: 'T', details: 'D' }])
  })
})
