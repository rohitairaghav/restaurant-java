import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * Create a Supabase client for client-side components
 * 
 * Uses Next.js auth helper which automatically reads:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 * 
 * These are embedded at build time by Next.js, so they're always available
 * in client-side code when properly set in .env.local
 */
export const createClient = () => {
  // createClientComponentClient automatically reads from process.env
  // NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
  return createClientComponentClient();
};