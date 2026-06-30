import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

export const SUPABASE_STRATEGY = 'supabase-jwt';

/**
 * Supabase JWT payload shape (relevant fields only).
 * Supabase issues JWTs with `sub` = auth.users.id and `email` in claims.
 */
interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  aud?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

/**
 * Passport strategy that validates Supabase-issued JWTs.
 * Extracts the Bearer token from the Authorization header and verifies
 * it with SUPABASE_JWT_SECRET.
 */
@Injectable()
export class SupabaseStrategy extends PassportStrategy(
  Strategy,
  SUPABASE_STRATEGY,
) {
  constructor(configService: ConfigService) {
    const jwtSecret = configService.get<string>('supabase.jwtSecret');
    if (!jwtSecret) {
      throw new Error('SUPABASE_JWT_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  /**
   * Called after JWT signature is verified.
   * Returns the AuthenticatedUser to be attached to request.user.
   * Throwing here results in a 401 Unauthorized response.
   */
  validate(payload: SupabaseJwtPayload): AuthenticatedUser {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token: missing sub claim');
    }
    if (!payload.email) {
      throw new UnauthorizedException('Invalid token: missing email claim');
    }
    return {
      supabaseUserId: payload.sub,
      email: payload.email,
    };
  }
}
