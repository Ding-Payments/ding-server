export { AuthModule } from './auth.module';
export { SupabaseAuthGuard } from './guards/supabase-auth.guard';
export {
  SupabaseStrategy,
  SUPABASE_STRATEGY,
} from './strategies/supabase.strategy';
export { Public, IS_PUBLIC_KEY } from './decorators/public.decorator';
export { CurrentUser } from './decorators/current-user.decorator';
export type { AuthenticatedUser } from './interfaces/authenticated-user.interface';
