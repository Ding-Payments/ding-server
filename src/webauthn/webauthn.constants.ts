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
 * Ding error codes surfaced by the WebAuthn flow. Consumed by the global
 * HttpExceptionFilter as the `code` field of the error envelope.
 */
export const WEBAUTHN_ERROR = {
  VERIFICATION_FAILED: 'WEBAUTHN_VERIFICATION_FAILED',
  CHALLENGE_EXPIRED: 'WEBAUTHN_CHALLENGE_EXPIRED',
  CREDENTIAL_EXISTS: 'WEBAUTHN_CREDENTIAL_EXISTS',
  NO_CREDENTIALS: 'WEBAUTHN_NO_CREDENTIALS',
} as const;
