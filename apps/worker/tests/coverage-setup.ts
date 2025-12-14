import { createRequire } from 'node:module'

try {
  const require = createRequire(import.meta.url)
  const { V8CoverageProvider } = require('@vitest/coverage-v8')
  if (V8CoverageProvider && !V8CoverageProvider.prototype.fetchCache) {
    V8CoverageProvider.prototype.fetchCache = {}
  }
}
catch {
  // ignore if plugin unavailable
}
