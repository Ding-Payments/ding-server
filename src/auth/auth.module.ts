import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SupabaseModule } from './supabase/supabase.module';
import { SupabaseStrategy } from './strategies/supabase.strategy';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { UsersModule } from '../modules/users/users.module';

@Module({
  imports: [PassportModule, SupabaseModule, UsersModule],
  providers: [SupabaseStrategy, SupabaseAuthGuard],
  exports: [PassportModule, SupabaseAuthGuard, UsersModule],
})
export class AuthModule {}
