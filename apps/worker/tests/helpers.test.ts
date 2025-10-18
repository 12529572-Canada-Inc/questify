import { describe, expect, it, vi } from 'vitest';
import { parseJsonFromModel } from '../src/helpers.js';

describe('parseJsonFromModel', () => {
  it('returns an empty array when the response is empty', () => {
    expect(parseJsonFromModel('')).toEqual([]);
  });

  it('strips json code fences and parses the payload', () => {
    const content = [
      '',
      '```json',
      '[',
      '  {"title": "First task", "details": "Do something"}',
      ']',
      '```',
      '',
    ].join('\n');

    expect(parseJsonFromModel(content)).toEqual([
      { title: 'First task', details: 'Do something' },
    ]);
  });

  it('repairs JSON blobs that contain unescaped newlines', () => {
    const malformed = `{
  "summary": "Line one",
  "details": "Line one
Line two"
}`;

    expect(parseJsonFromModel(malformed)).toEqual({
      summary: 'Line one',
      details: 'Line one\nLine two',
    });
  });

  it('logs the cleaned payload before rethrowing invalid JSON', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => parseJsonFromModel('not-json')).toThrow();
    expect(errorSpy).toHaveBeenCalledWith(
      'Failed to parse JSON from response:',
      'not-json',
    );

    errorSpy.mockRestore();
  });
});
