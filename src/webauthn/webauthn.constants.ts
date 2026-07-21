/**
 * WebAuthn challenge types stored in `webauthn_challenges.type`.
 * REGISTRATION guards passkey enrolment; AUTHENTICATION guards a payment
 * authorization (scoped by paymentId).
 */
export const CHALLENGE_TYPE = {
  REGISTRATION: 'registration',
  AUTHENTICATION: 'authentication',
} as const;

export type ChallengeType =
  (typeof CHALLENGE_TYPE)[keyof typeof CHALLENGE_TYPE];

/**
 * Time-to-live for a stored WebAuthn challenge. Kept as a constant (not an env
 * var) to keep the config surface lean — 5 minutes matches the client ceremony
 * window and the PAYMENT_SUBMIT_TIMEOUT_MS default.
 */
export const CHALLENGE_TTL_MS = 5 * 60 * 1000;

/**
 * Per-device credentials policy (SRV-046).
 *
 * Ding is a payments app: a passkey is the only thing standing between an
 * authenticated Supabase session and moving funds. Two rules follow from that:
 *
 * 1. Bound enrolment — a user can register at most this many passkeys. This
 *    limits the blast radius of a compromised or lost device and keeps the
 *    `webauthn.authenticate/options` `allowCredentials` list small. Kept as a
 *    constant (not an env var) for the same reason as CHALLENGE_TTL_MS.
 * 2. Never zero — a user is never allowed to revoke their last remaining
 *    credential. Doing so would permanently lock them out of authorizing
 *    payments (there is no password fallback in the hybrid auth model).
 */
export const MAX_CREDENTIALS_PER_USER = 5;

/**
 * Ding error codes surfaced by the WebAuthn flow. Consumed by the global
 * HttpExceptionFilter as the `code` field of the error envelope.
 */
export const WEBAUTHN_ERROR = {
  VERIFICATION_FAILED: 'WEBAUTHN_VERIFICATION_FAILED',
  CHALLENGE_EXPIRED: 'WEBAUTHN_CHALLENGE_EXPIRED',
  CREDENTIAL_EXISTS: 'WEBAUTHN_CREDENTIAL_EXISTS',
  NO_CREDENTIALS: 'WEBAUTHN_NO_CREDENTIALS',
  CREDENTIAL_LIMIT_REACHED: 'WEBAUTHN_CREDENTIAL_LIMIT_REACHED',
  CREDENTIAL_NOT_FOUND: 'WEBAUTHN_CREDENTIAL_NOT_FOUND',
  LAST_CREDENTIAL: 'WEBAUTHN_LAST_CREDENTIAL',
} as const;
