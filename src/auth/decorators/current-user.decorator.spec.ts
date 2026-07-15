import { ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

describe('CurrentUser Decorator Logic', () => {
  it('should extract user from request object', () => {
    const mockUser: AuthenticatedUser = {
      supabaseUserId: 'user-123',
      email: 'test@example.com',
      emailVerified: true,
    };

    const mockRequest = {
      user: mockUser,
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const request = mockContext.switchToHttp().getRequest();
    const result = request.user;

    expect(result).toEqual(mockUser);
    expect(result.supabaseUserId).toBe('user-123');
    expect(result.email).toBe('test@example.com');
  });

  it('should return user from request context', () => {
    const mockUser: AuthenticatedUser = {
      supabaseUserId: 'user-456',
      email: 'another@test.com',
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: mockUser,
        }),
      }),
    } as unknown as ExecutionContext;

    const request = mockContext.switchToHttp().getRequest();
    const result = request.user;

    expect(result.supabaseUserId).toBe('user-456');
  });

  it('should handle missing email field', () => {
    const mockUser: AuthenticatedUser = {
      supabaseUserId: 'user-789',
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: mockUser,
        }),
      }),
    } as unknown as ExecutionContext;

    const request = mockContext.switchToHttp().getRequest();
    const result = request.user;

    expect(result.supabaseUserId).toBe('user-789');
    expect(result.email).toBeUndefined();
  });
});
