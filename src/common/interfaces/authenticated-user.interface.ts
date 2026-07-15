export interface AuthenticatedUser {
  supabaseUserId: string;
  email?: string;
  emailVerified?: boolean;
}
