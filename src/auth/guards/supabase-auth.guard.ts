import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SUPABASE_STRATEGY } from '../strategies/supabase.strategy';

/**
 * Global JWT authentication guard.
 * Skips verification for routes decorated with @Public().
 * Applied globally via APP_GUARD in AppModule.
 *
 * On valid JWT: populates request.user with AuthenticatedUser.
 * On invalid/missing JWT: throws 401 Unauthorized.
 */
@Injectable()
export class SupabaseAuthGuard extends AuthGuard(SUPABASE_STRATEGY) {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: Error | null, user: TUser): TUser {
    if (err || !user) {
      throw new UnauthorizedException('Unauthorized');
    }
    return user;
  }
}
