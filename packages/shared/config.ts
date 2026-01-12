/**
 * Centralized Supabase Configuration
 * 
 * This module provides secure, validated Supabase configuration
 * for use across web, mobile, and server applications.
 * 
 * Security Features:
 * - Environment variable validation
 * - No hardcoded credentials
 * - Type-safe configuration
 * - Runtime validation
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

/**
 * Validates that a required environment variable is set
 * Handles both server-side (Node.js) and client-side (browser) environments
 */
function requireEnv(key: string, platform?: 'web' | 'mobile'): string {
  // In browser/client-side, check both process.env and window (for Next.js)
  let value: string | undefined;
  
  if (typeof window !== 'undefined') {
    // Client-side: Next.js embeds NEXT_PUBLIC_ vars at build time
    // They should be available in process.env
    value = process.env[key];
  } else {
    // Server-side: standard Node.js process.env
    value = process.env[key];
  }
  
  // Also check if it's available via globalThis (some bundlers)
  if (!value && typeof globalThis !== 'undefined') {
    value = (globalThis as any).process?.env?.[key];
  }
  
  if (!value || value === 'undefined' || value.trim() === '') {
    const platformHint = platform === 'web' 
      ? ' (Set NEXT_PUBLIC_SUPABASE_URL in .env.local and restart dev server)'
      : platform === 'mobile'
      ? ' (Set EXPO_PUBLIC_SUPABASE_URL in .env)'
      : '';
    
    throw new Error(
      `Required environment variable ${key} is not set${platformHint}. ` +
      `Please check your environment configuration.`
    );
  }
  
  return value;
}

/**
 * Validates Supabase URL format
 */
function validateSupabaseUrl(url: string): void {
  try {
    const urlObj = new URL(url);
    
    if (!urlObj.protocol.startsWith('https')) {
      throw new Error('Supabase URL must use HTTPS');
    }
    
    if (!urlObj.hostname.includes('supabase.co')) {
      console.warn('Warning: Supabase URL does not match expected pattern (*.supabase.co)');
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Invalid Supabase URL format: ${url}`);
    }
    throw error;
  }
}

/**
 * Validates Supabase anon key format (basic JWT validation)
 */
function validateAnonKey(key: string): void {
  if (!key || key.length < 50) {
    throw new Error('Invalid Supabase anon key format');
  }
  
  // Basic JWT structure check (header.payload.signature)
  const parts = key.split('.');
  if (parts.length !== 3) {
    throw new Error('Supabase anon key must be a valid JWT token');
  }
}

/**
 * Get Supabase configuration for web applications (Next.js)
 * 
 * @throws Error if required environment variables are missing
 */
export function getSupabaseConfigWeb(): SupabaseConfig {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL', 'web');
  const anonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'web');
  
  validateSupabaseUrl(url);
  validateAnonKey(anonKey);
  
  return {
    url,
    anonKey,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY, // Optional, only for admin operations
  };
}

/**
 * Get Supabase configuration for mobile applications (React Native/Expo)
 * 
 * @throws Error if required environment variables are missing
 */
export function getSupabaseConfigMobile(): SupabaseConfig {
  const url = requireEnv('EXPO_PUBLIC_SUPABASE_URL', 'mobile');
  const anonKey = requireEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', 'mobile');
  
  validateSupabaseUrl(url);
  validateAnonKey(anonKey);
  
  return {
    url,
    anonKey,
  };
}

/**
 * Get Supabase configuration for server-side operations
 * Uses web environment variables but can be used in Node.js contexts
 * 
 * @throws Error if required environment variables are missing
 */
export function getSupabaseConfigServer(): SupabaseConfig {
  // Try web env vars first, then generic
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url) {
    throw new Error(
      'Required environment variable SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is not set. ' +
      'Please check your server environment configuration.'
    );
  }
  
  if (!anonKey) {
    throw new Error(
      'Required environment variable SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. ' +
      'Please check your server environment configuration.'
    );
  }
  
  validateSupabaseUrl(url);
  validateAnonKey(anonKey);
  
  return {
    url,
    anonKey,
    serviceRoleKey, // Optional, only for admin operations
  };
}

/**
 * Get database configuration for direct PostgreSQL connections (Liquibase)
 * 
 * @throws Error if required environment variables are missing
 */
export function getDatabaseConfig(): DatabaseConfig {
  // Try to parse from JDBC URL or use individual env vars
  const jdbcUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
  
  if (jdbcUrl) {
    // Parse JDBC URL: jdbc:postgresql://host:port/database
    const match = jdbcUrl.match(/jdbc:postgresql:\/\/([^:]+):(\d+)\/(.+)/);
    if (match) {
      return {
        host: match[1],
        port: parseInt(match[2], 10),
        database: match[3],
        username: requireEnv('DATABASE_USERNAME'),
        password: requireEnv('DATABASE_PASSWORD'),
      };
    }
  }
  
  // Fallback to individual environment variables
  return {
    host: requireEnv('DATABASE_HOST'),
    port: parseInt(requireEnv('DATABASE_PORT') || '5432', 10),
    database: requireEnv('DATABASE_NAME'),
    username: requireEnv('DATABASE_USERNAME'),
    password: requireEnv('DATABASE_PASSWORD'),
  };
}

/**
 * Check if we're in a development environment
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || 
         process.env.NODE_ENV !== 'production';
}

/**
 * Check if we're in a production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

