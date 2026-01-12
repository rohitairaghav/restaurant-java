import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseConfigWeb } from '@restaurant-inventory/shared';

/**
 * Create a Supabase client for use in API routes (Route Handlers)
 * This properly handles authentication cookies server-side
 * Uses centralized configuration with validation
 */
export const createServerClient = () => {
  const cookieStore = cookies();
  const config = getSupabaseConfigWeb();

  return createRouteHandlerClient(
    { cookies: () => cookieStore },
    {
      supabaseUrl: config.url,
      supabaseKey: config.anonKey,
    }
  );
};
