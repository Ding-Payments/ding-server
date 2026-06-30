import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { SupabaseStrategy } from './supabase.strategy';

describe('SupabaseStrategy', () => {
  let strategy: SupabaseStrategy;

  /**
   * Build a ConfigService stub that returns the given jwtSecret.
   */
  function makeConfigService(jwtSecret: string | undefined) {
    return {
      get: jest.fn((key: string) => {
        if (key === 'supabase.jwtSecret') return jwtSecret;
        return undefined;
      }),
    } as unknown as ConfigService;
  }

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SupabaseStrategy,
        {
          provide: ConfigService,
          useValue: makeConfigService('test-jwt-secret'),
        },
      ],
    }).compile();

    strategy = module.get<SupabaseStrategy>(SupabaseStrategy);
  });

  describe('constructor', () => {
    it('throws when SUPABASE_JWT_SECRET is not configured', () => {
      expect(() => new SupabaseStrategy(makeConfigService(undefined))).toThrow(
        'SUPABASE_JWT_SECRET is not configured',
      );
    });

    it('constructs successfully when secret is provided', () => {
      expect(strategy).toBeDefined();
    });
  });

  describe('validate()', () => {
    it('returns AuthenticatedUser for a valid payload', () => {
      const result = strategy.validate({
        sub: 'supabase-user-uuid',
        email: 'user@example.com',
      });

      expect(result).toEqual({
        supabaseUserId: 'supabase-user-uuid',
        email: 'user@example.com',
      });
    });

    it('throws UnauthorizedException when sub is missing', () => {
      expect(() =>
        strategy.validate({ sub: '', email: 'user@example.com' }),
      ).toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when email is missing', () => {
      expect(() =>
        strategy.validate({ sub: 'supabase-user-uuid', email: undefined }),
      ).toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when sub and email are both missing', () => {
      expect(() => strategy.validate({ sub: '', email: undefined })).toThrow(
        UnauthorizedException,
      );
    });

    it('includes supabaseUserId and email from the JWT sub and email claims', () => {
      const payload = {
        sub: 'abc-123',
        email: 'alice@example.com',
        iat: 1000000,
        exp: 9999999,
        aud: 'authenticated',
        role: 'authenticated',
      };

      const result = strategy.validate(payload);

      expect(result.supabaseUserId).toBe('abc-123');
      expect(result.email).toBe('alice@example.com');
    });
  });
});
