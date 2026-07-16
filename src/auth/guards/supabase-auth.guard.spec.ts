import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('SupabaseAuthGuard', () => {
  it('should be defined', () => {
    const mockReflector = new Reflector();
    const guard = new SupabaseAuthGuard(mockReflector);
    expect(guard).toBeDefined();
  });

  it('should skip auth for public routes', () => {
    const mockReflector = {
      getAllAndOverride: jest.fn().mockReturnValue(true),
    } as unknown as Reflector;

    const guard = new SupabaseAuthGuard(mockReflector);

    const mockHandler = () => {};
    const mockClass = class {};

    const mockContext = {
      getHandler: () => mockHandler,
      getClass: () => mockClass,
    } as unknown as ExecutionContext;

    const result = guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it('should check for IS_PUBLIC_KEY metadata', () => {
    const mockHandler = () => {};
    const mockClass = class {};

    const getAllAndOverride = jest.fn().mockReturnValue(true);
    const mockReflector = { getAllAndOverride } as unknown as Reflector;

    const guard = new SupabaseAuthGuard(mockReflector);

    const mockContext = {
      getHandler: () => mockHandler,
      getClass: () => mockClass,
    } as unknown as ExecutionContext;

    void guard.canActivate(mockContext);

    expect(getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      mockHandler,
      mockClass,
    ]);
  });
});
