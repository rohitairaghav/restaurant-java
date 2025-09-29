import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get environment variables with fallback for debugging
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ljfnqzlzffvfhsantcqy.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqZm5xemx6ZmZ2ZmhzYW50Y3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTIxNjgsImV4cCI6MjA3NDU2ODE2OH0.SHhhIZlmS2UOrpQEozf3N_9Bl2p31nUH3xeHgET6ia4';

// Validate environment variables
if (!supabaseUrl || supabaseUrl === 'undefined') {
  console.error('EXPO_PUBLIC_SUPABASE_URL is not set');
  throw new Error('EXPO_PUBLIC_SUPABASE_URL is required');
}

if (!supabaseAnonKey || supabaseAnonKey === 'undefined') {
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY is not set');
  throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is required');
}

console.log('Supabase URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});