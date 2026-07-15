import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseJwtPayload } from '../supabase/supabase.service';
import { UsersService } from '../../modules/users/users.service';

export interface ValidatedSupabaseUser {
  supabaseUserId: string;
  email?: string;
  emailVerified?: boolean;
}

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
  ) {
    const jwtSecret = configService.get<string>('supabase.jwtSecret');
    if (!jwtSecret) {
      throw new Error('SUPABASE_JWT_SECRET is not configured');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secret: jwtSecret,
    } as any);
  }

  async validate(payload: SupabaseJwtPayload): Promise<ValidatedSupabaseUser> {
    // Sync or create user on successful JWT validation
    try {
      await this.usersService.createOrUpdateUser({
        supabaseUserId: payload.sub,
        email: payload.email,
      });
    } catch (error) {
      // Log but don't fail auth if user sync fails
      console.error('Failed to sync user on login:', error);
    }

    return {
      supabaseUserId: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified ?? false,
    };
  }
}
