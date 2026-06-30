/**
 * Represents the authenticated user extracted from a Supabase JWT.
 * Populated by SupabaseStrategy.validate() and attached to request.user.
 */
export interface AuthenticatedUser {
  /** Supabase auth.users.id — UUID */
  supabaseUserId: string;
  /** User's email from the JWT claims */
  email: string;
}
