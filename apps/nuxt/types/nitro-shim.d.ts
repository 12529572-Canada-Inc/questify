// TypeScript helper definitions for Nitro test utilities
// -----------------------------------------------------
// This avoids tight coupling to internal Nitro / H3 types
// and gives predictable IntelliSense during test authoring.

declare module '../utils/nitro' {
  /** A lightweight wrapper returned from `listhen()` */
  export interface TestListener {
    /** The running HTTP server instance */
    server: import('node:http').Server
    /** The base URL for supertest requests (e.g., http://localhost:3000) */
    url: string
    /** Gracefully close the listener */
    close(): Promise<void>
  }

  /** The return shape of setupNitro() */
  export interface NitroTestContext {
    /** The Nitro instance from the built app */
    nitro: any
    /** The live HTTP listener */
    listener: TestListener
  }

  /** Sets up the built Nitro app and starts a listener */
  export function setupNitro(): Promise<NitroTestContext>
}
