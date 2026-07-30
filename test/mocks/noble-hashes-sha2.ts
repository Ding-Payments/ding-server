import { createHash } from 'node:crypto';

function digest(algorithm: 'sha256' | 'sha512', input: Uint8Array): Uint8Array {
  return Uint8Array.from(createHash(algorithm).update(input).digest());
}

export const sha256 = (input: Uint8Array): Uint8Array =>
  digest('sha256', input);

export const sha512 = (input: Uint8Array): Uint8Array =>
  digest('sha512', input);
