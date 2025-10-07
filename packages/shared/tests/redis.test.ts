import { describe, expect, it } from "vitest"
import { parseRedisUrl } from "../src/redis"

describe("parseRedisUrl", () => {
  it("returns default port when none is provided", () => {
    expect(parseRedisUrl("redis://localhost")).toEqual({
      host: "localhost",
      port: 6379,
      password: undefined,
      tls: undefined,
    })
  })

  it("parses explicit ports", () => {
    expect(parseRedisUrl("redis://localhost:6380")).toEqual({
      host: "localhost",
      port: 6380,
      password: undefined,
      tls: undefined,
    })
  })

  it("enables tls for rediss protocol", () => {
    expect(parseRedisUrl("rediss://:secret@redis.example.com")).toEqual({
      host: "redis.example.com",
      port: 6379,
      password: "secret",
      tls: {},
    })
  })
})

