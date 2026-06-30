import * as jwt from 'jsonwebtoken';

export const TEST_JWT_SECRET = 'test-supabase-jwt-secret-for-e2e';

export interface TestUser {
  supabaseUserId: string;
  email: string;
}

/**
 * Mint a signed JWT that the SupabaseStrategy will accept.
 * Uses the TEST_JWT_SECRET which is injected via process.env.SUPABASE_JWT_SECRET.
 */
export function mintJwt(user: TestUser, expiresIn = '1h'): string {
  return jwt.sign(
    {
      sub: user.supabaseUserId,
      email: user.email,
      aud: 'authenticated',
      role: 'authenticated',
    },
    TEST_JWT_SECRET,
    { expiresIn } as jwt.SignOptions,
  );
}

/**
 * Returns the Authorization header value for a test user.
 */
export function authHeader(user: TestUser): string {
  return `Bearer ${mintJwt(user)}`;
}
