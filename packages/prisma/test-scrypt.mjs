import { Scrypt } from 'oslo/password'

const s = new Scrypt()
const hash = await s.hash('testpassword123')
console.log('✅ Hash:', hash)

console.log('🔍 Verify:', await s.verify('testpassword123', hash))
