import crypto from 'crypto'

const ALGORITHM  = 'aes-256-cbc'
const KEY_HEX    = process.env.ENCRYPTION_KEY ?? ''

function getKey(): Buffer {
  if (!KEY_HEX) {
    throw new Error('ENCRYPTION_KEY env var is missing')
  }
  if (KEY_HEX.length !== 64) {
    throw new Error(
      `ENCRYPTION_KEY must be 64 hex chars (got ${KEY_HEX.length}). Run: openssl rand -hex 32`
    )
  }
  return Buffer.from(KEY_HEX, 'hex')
}

/**
 * Encrypts a plaintext string.
 * Returns "iv:encrypted" — both hex-encoded.
 */
export function encrypt(plaintext: string): string {
  const iv         = crypto.randomBytes(16)
  const cipher     = crypto.createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted  = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`
}

/**
 * Decrypts a string produced by encrypt().
 * Expects "iv:encrypted" format.
 */
export function decrypt(ciphertext: string): string {
  const [ivHex, encryptedHex] = ciphertext.split(':')
  if (!ivHex || !encryptedHex) {
    throw new Error('Invalid ciphertext format — expected "iv:encrypted"')
  }
  const iv        = Buffer.from(ivHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const decipher  = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString('utf8')
}