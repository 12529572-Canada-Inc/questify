import { createRequire } from 'node:module'

try {
  const require = createRequire(import.meta.url)
  const mod = require('@vitest/coverage-v8')
  const Provider = mod?.V8CoverageProvider ?? mod?.default?.V8CoverageProvider ?? mod?.default
  if (Provider) {
    const proto = Provider.prototype as Record<string, any>
    if (!proto.fetchCache) proto.fetchCache = new Map()
    if (!proto.__patchedConvert) {
      const original = proto.convertCoverage?.bind(proto)
      proto.convertCoverage = function convertCoveragePatched(...args: any[]) {
        if (!this.fetchCache) this.fetchCache = new Map()
        return original ? original.apply(this, args) : undefined
      }
      proto.__patchedConvert = true
    }
  }
}
catch {
  // ignore if plugin unavailable
}
