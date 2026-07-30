import {
  createPrivateKey,
  createPublicKey,
  randomBytes,
  sign as nodeSign,
  verify as nodeVerify,
} from 'node:crypto';

const PKCS8_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex');
const SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

export const hashes: { sha512?: (input: Uint8Array) => Uint8Array } = {};
export const etc = {};

export const utils = {
  randomSecretKey: (): Uint8Array => Uint8Array.from(randomBytes(32)),
};

export function getPublicKey(secretKey: Uint8Array): Uint8Array {
  const privateKey = privateKeyFromSeed(secretKey);
  const der = createPublicKey(privateKey).export({
    format: 'der',
    type: 'spki',
  });
  return Uint8Array.from(der.subarray(-32));
}

export function sign(message: Uint8Array, secretKey: Uint8Array): Uint8Array {
  return Uint8Array.from(
    nodeSign(null, message, privateKeyFromSeed(secretKey)),
  );
}

export function verify(
  signature: Uint8Array,
  message: Uint8Array,
  publicKey: Uint8Array,
): boolean {
  const key = createPublicKey({
    key: Buffer.concat([SPKI_PREFIX, Buffer.from(publicKey)]),
    format: 'der',
    type: 'spki',
  });
  return nodeVerify(null, message, key, signature);
}

function privateKeyFromSeed(secretKey: Uint8Array) {
  return createPrivateKey({
    key: Buffer.concat([PKCS8_PREFIX, Buffer.from(secretKey)]),
    format: 'der',
    type: 'pkcs8',
  });
}
