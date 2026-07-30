export function uint8ArrayToBase64(value: Uint8Array): string {
  return Buffer.from(value).toString('base64');
}

export function base64ToUint8Array(value: string): Uint8Array {
  return Uint8Array.from(Buffer.from(value, 'base64'));
}
