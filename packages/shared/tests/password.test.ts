import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../src/password'

describe('Password hashing and verification', () => {
  const plain = 'testpassword123'

  it('hashes and verifies the same password correctly', () => {
    const hash = hashPassword(plain)
    expect(hash).toMatch(/^\$scrypt\$/)
    expect(verifyPassword(plain, hash)).toBe(true)
  })

  it('fails verification with an incorrect password', () => {
    const hash = hashPassword(plain)
    expect(verifyPassword('wrongpassword', hash)).toBe(false)
  })

  it('produces unique hashes for the same password (different salt)', () => {
    const h1 = hashPassword(plain)
    const h2 = hashPassword(plain)
    expect(h1).not.toBe(h2)
  })

  it('rejects invalid or malformed hashes gracefully', () => {
    const badHashes = [
      '',
      'not-a-hash',
      '$scrypt$n=16384,r=8,p=1$$$', // incomplete structure
      '$bcrypt$stuff' // wrong algorithm
    ]
    for (const bad of badHashes) {
      expect(verifyPassword(plain, bad)).toBe(false)
    }
  })
})
