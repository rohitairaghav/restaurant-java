// Mock Supabase client
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
  })),
}));

import { createClient } from '@/lib/supabase';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

describe('Supabase Client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createClient', () => {
    it('should create a Supabase client with environment variables', () => {
      const client = createClient();

      expect(createClientComponentClient).toHaveBeenCalledWith({
        supabaseUrl: 'https://test.supabase.co',
        supabaseKey: 'test-anon-key',
      });
      expect(client).toBeDefined();
      expect(client.auth).toBeDefined();
      expect(client.from).toBeDefined();
    });

    it('should create client with custom URL', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://custom.supabase.co';

      createClient();

      expect(createClientComponentClient).toHaveBeenCalledWith({
        supabaseUrl: 'https://custom.supabase.co',
        supabaseKey: 'test-anon-key',
      });
    });

    it('should create client with custom anon key', () => {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'custom-anon-key';

      createClient();

      expect(createClientComponentClient).toHaveBeenCalledWith({
        supabaseUrl: 'https://test.supabase.co',
        supabaseKey: 'custom-anon-key',
      });
    });

    it('should return a client object', () => {
      const client = createClient();

      expect(typeof client).toBe('object');
      expect(client).not.toBeNull();
    });

    it('should call createClientComponentClient once per invocation', () => {
      (createClientComponentClient as jest.Mock).mockClear();

      createClient();
      createClient();

      expect(createClientComponentClient).toHaveBeenCalledTimes(2);
    });
  });
});
