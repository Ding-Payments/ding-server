export default function globalSetup(): void {
  process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
  process.env.PORT = process.env.PORT ?? '3000';
  process.env.API_PREFIX = process.env.API_PREFIX ?? 'v1';
  process.env.CORS_ORIGINS =
    process.env.CORS_ORIGINS ?? 'http://localhost:8081';
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ??
    'postgresql://postgres:password@localhost:5432/postgres';
  process.env.DIRECT_URL =
    process.env.DIRECT_URL ??
    'postgresql://postgres:password@localhost:5432/postgres';
  process.env.SUPABASE_URL =
    process.env.SUPABASE_URL ?? 'https://example.supabase.co';
  process.env.SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET ?? 'secret';
  process.env.SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'service_role';
  process.env.STELLAR_NETWORK = process.env.STELLAR_NETWORK ?? 'testnet';
  process.env.STELLAR_HORIZON_URL =
    process.env.STELLAR_HORIZON_URL ?? 'https://horizon-testnet.stellar.org';
  process.env.STELLAR_RPC_URL =
    process.env.STELLAR_RPC_URL ?? 'https://soroban-testnet.stellar.org';
  process.env.STELLAR_USDC_ISSUER =
    process.env.STELLAR_USDC_ISSUER ??
    'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
  process.env.STELLAR_NETWORK_PASSPHRASE =
    process.env.STELLAR_NETWORK_PASSPHRASE ??
    'Test SDF Network ; September 2015';
  process.env.WEBAUTHN_RP_ID = process.env.WEBAUTHN_RP_ID ?? 'localhost';
  process.env.WEBAUTHN_RP_NAME =
    process.env.WEBAUTHN_RP_NAME ?? 'Ding Payments';
  process.env.WEBAUTHN_ORIGIN =
    process.env.WEBAUTHN_ORIGIN ?? 'http://localhost:8081';
  process.env.PAYMENT_SUBMIT_TIMEOUT_MS =
    process.env.PAYMENT_SUBMIT_TIMEOUT_MS ?? '300000';
  process.env.PAYMENT_POLL_INTERVAL_MS =
    process.env.PAYMENT_POLL_INTERVAL_MS ?? '2000';
  process.env.PAYMENT_POLL_MAX_ATTEMPTS =
    process.env.PAYMENT_POLL_MAX_ATTEMPTS ?? '30';
  process.env.THROTTLE_TTL_MS = process.env.THROTTLE_TTL_MS ?? '60000';
  process.env.THROTTLE_LIMIT = process.env.THROTTLE_LIMIT ?? '100';
}
