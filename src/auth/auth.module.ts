import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SupabaseStrategy } from './strategies/supabase.strategy';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

/**
 * AuthModule — provides Supabase JWT passport strategy and auth guard.
 * Import this module in AppModule and register APP_GUARD globally.
 */
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'supabase-jwt' })],
  providers: [SupabaseStrategy, SupabaseAuthGuard],
  exports: [SupabaseAuthGuard, SupabaseStrategy],
})
export class AuthModule {}
