import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseConfigMobile } from '@restaurant-inventory/shared';

/**
 * Create Supabase client for mobile applications
 * Uses centralized configuration with validation
 * 
 * SECURITY: No hardcoded credentials - all values come from environment variables
 */
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const getSupabaseClient = () => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  try {
    const config = getSupabaseConfigMobile();
    
    supabaseInstance = createClient(config.url, config.anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    
    return supabaseInstance;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    throw error;
  }
};

// Export singleton instance for backward compatibility
export const supabase = getSupabaseClient();