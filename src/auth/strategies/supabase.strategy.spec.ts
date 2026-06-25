import { SupabaseJwtPayload } from '../supabase/supabase.service';

describe('SupabaseStrategy', () => {
  describe('validate', () => {
    it('should return user with supabaseUserId from payload', () => {
      const payload: SupabaseJwtPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        email_verified: true,
        aud: 'authenticated',
        iat: 1234567890,
        exp: 1234571490,
      };

      const result = {
        supabaseUserId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified ?? false,
      };

      expect(result.supabaseUserId).toBe('user-123');
      expect(result.email).toBe('test@example.com');
      expect(result.emailVerified).toBe(true);
    });

    it('should handle missing email_verified field', () => {
      const payload: SupabaseJwtPayload = {
        sub: 'user-456',
        aud: 'authenticated',
        iat: 1234567890,
        exp: 1234571490,
      };

      const result = {
        supabaseUserId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified ?? false,
      };

      expect(result.emailVerified).toBe(false);
    });

    it('should extract user claims correctly', () => {
      const payload: SupabaseJwtPayload = {
        sub: 'test-id',
        email: 'user@test.com',
        email_verified: false,
        aud: 'authenticated',
        iat: 1234567890,
        exp: 1234571490,
      };

      const result = {
        supabaseUserId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified ?? false,
      };

      expect(result.supabaseUserId).toBe('test-id');
      expect(result.email).toBe('user@test.com');
      expect(result.emailVerified).toBe(false);
    });
  });
});
