import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a route handler or controller as publicly accessible.
 * Routes decorated with @Public() bypass the global SupabaseAuthGuard.
 *
 * @example
 * \@Public()
 * \@Get('health')
 * health() { return 'ok'; }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
