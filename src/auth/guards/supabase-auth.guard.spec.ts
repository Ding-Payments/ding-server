import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Build a mock ExecutionContext with handler/class metadata stubs.
 */
function makeContext(
  handlerMetadata: Record<string, unknown> = {},
  classMetadata: Record<string, unknown> = {},
): ExecutionContext {
  return {
    getHandler: () => ({ ...handlerMetadata }),
    getClass: () => ({ ...classMetadata }),
    switchToHttp: () => ({
      getRequest: () => ({ headers: {} }),
      getResponse: () => ({}),
    }),
  } as unknown as ExecutionContext;
}

describe('SupabaseAuthGuard', () => {
  let guard: SupabaseAuthGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [SupabaseAuthGuard, Reflector],
    }).compile();

    guard = module.get<SupabaseAuthGuard>(SupabaseAuthGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  describe('canActivate()', () => {
    it('returns true immediately for a route marked @Public()', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockImplementation((key: unknown) => {
          if (key === IS_PUBLIC_KEY) return true;
          return undefined;
        });

      // Should short-circuit without calling super.canActivate()
      const result = guard.canActivate(makeContext());
      expect(result).toBe(true);
    });

    it('does NOT short-circuit for a non-public route', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      // Stub super.canActivate to avoid real passport execution in unit test
      const superActivateSpy = jest
        .spyOn(
          Object.getPrototypeOf(Object.getPrototypeOf(guard)),
          'canActivate',
        )
        .mockReturnValue(false);

      const result = guard.canActivate(makeContext());

      expect(result).not.toBe(true);
      superActivateSpy.mockRestore();
    });
  });

  describe('handleRequest()', () => {
    it('returns the user when no error and user is present', () => {
      const user = { supabaseUserId: 'abc', email: 'a@b.com' };
      const result = guard.handleRequest(null, user);
      expect(result).toBe(user);
    });

    it('throws UnauthorizedException when err is set', () => {
      expect(() => guard.handleRequest(new Error('jwt expired'), null)).toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when user is falsy (null)', () => {
      expect(() => guard.handleRequest(null, null)).toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when user is undefined', () => {
      expect(() => guard.handleRequest(null, undefined)).toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when err is set even if user is present', () => {
      expect(() =>
        guard.handleRequest(new Error('invalid'), { supabaseUserId: 'abc' }),
      ).toThrow(UnauthorizedException);
    });
  });
});
