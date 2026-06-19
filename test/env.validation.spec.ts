import { envValidationSchema } from '../src/config/env.validation';

describe('Environment validation schema', () => {
  it('should validate a full environment successfully', () => {
    const env = {
      NODE_ENV: 'development',
      PORT: '3000',
      API_PREFIX: 'v1',
      CORS_ORIGINS: 'http://localhost:8081',
      DATABASE_URL: 'postgresql://postgres:password@localhost:5432/postgres',
      DIRECT_URL: 'postgresql://postgres:password@localhost:5432/postgres',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_JWT_SECRET: 'secret',
      SUPABASE_SERVICE_ROLE_KEY: 'service_role',
      STELLAR_NETWORK: 'testnet',
      STELLAR_HORIZON_URL: 'https://horizon-testnet.stellar.org',
      STELLAR_RPC_URL: 'https://soroban-testnet.stellar.org',
      STELLAR_USDC_ISSUER:
        'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      STELLAR_NETWORK_PASSPHRASE: 'Test SDF Network ; September 2015',
      WEBAUTHN_RP_ID: 'localhost',
      WEBAUTHN_RP_NAME: 'Ding Payments',
      WEBAUTHN_ORIGIN: 'http://localhost:8081',
      PAYMENT_SUBMIT_TIMEOUT_MS: '300000',
      PAYMENT_POLL_INTERVAL_MS: '2000',
      PAYMENT_POLL_MAX_ATTEMPTS: '30',
      THROTTLE_TTL_MS: '60000',
      THROTTLE_LIMIT: '100',
    };

    const { error } = envValidationSchema.validate(env, {
      abortEarly: false,
      allowUnknown: false,
    });

    expect(error).toBeUndefined();
  });

  it('should return a descriptive error when PORT is missing', () => {
    const env = {
      NODE_ENV: 'development',
      API_PREFIX: 'v1',
      CORS_ORIGINS: 'http://localhost:8081',
      DATABASE_URL: 'postgresql://postgres:password@localhost:5432/postgres',
      DIRECT_URL: 'postgresql://postgres:password@localhost:5432/postgres',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_JWT_SECRET: 'secret',
      SUPABASE_SERVICE_ROLE_KEY: 'service_role',
      STELLAR_NETWORK: 'testnet',
      STELLAR_HORIZON_URL: 'https://horizon-testnet.stellar.org',
      STELLAR_RPC_URL: 'https://soroban-testnet.stellar.org',
      STELLAR_USDC_ISSUER:
        'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      STELLAR_NETWORK_PASSPHRASE: 'Test SDF Network ; September 2015',
      WEBAUTHN_RP_ID: 'localhost',
      WEBAUTHN_RP_NAME: 'Ding Payments',
      WEBAUTHN_ORIGIN: 'http://localhost:8081',
      PAYMENT_SUBMIT_TIMEOUT_MS: '300000',
      PAYMENT_POLL_INTERVAL_MS: '2000',
      PAYMENT_POLL_MAX_ATTEMPTS: '30',
      THROTTLE_TTL_MS: '60000',
      THROTTLE_LIMIT: '100',
    };

    const { error } = envValidationSchema.validate(env, {
      abortEarly: false,
      allowUnknown: false,
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('"PORT" is required');
  });

  it('should return a descriptive error when NODE_ENV is invalid', () => {
    const env = {
      NODE_ENV: 'invalid',
      PORT: '3000',
      API_PREFIX: 'v1',
      CORS_ORIGINS: 'http://localhost:8081',
      DATABASE_URL: 'postgresql://postgres:password@localhost:5432/postgres',
      DIRECT_URL: 'postgresql://postgres:password@localhost:5432/postgres',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_JWT_SECRET: 'secret',
      SUPABASE_SERVICE_ROLE_KEY: 'service_role',
      STELLAR_NETWORK: 'testnet',
      STELLAR_HORIZON_URL: 'https://horizon-testnet.stellar.org',
      STELLAR_RPC_URL: 'https://soroban-testnet.stellar.org',
      STELLAR_USDC_ISSUER:
        'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      STELLAR_NETWORK_PASSPHRASE: 'Test SDF Network ; September 2015',
      WEBAUTHN_RP_ID: 'localhost',
      WEBAUTHN_RP_NAME: 'Ding Payments',
      WEBAUTHN_ORIGIN: 'http://localhost:8081',
      PAYMENT_SUBMIT_TIMEOUT_MS: '300000',
      PAYMENT_POLL_INTERVAL_MS: '2000',
      PAYMENT_POLL_MAX_ATTEMPTS: '30',
      THROTTLE_TTL_MS: '60000',
      THROTTLE_LIMIT: '100',
    };

    const { error } = envValidationSchema.validate(env, {
      abortEarly: false,
      allowUnknown: false,
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain(
      '"NODE_ENV" must be one of [development, production, test]',
    );
  });
});
