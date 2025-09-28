import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@restaurant-inventory/shared';
import { createClient } from '../supabase';
import { isDemoMode } from '../demo-mode';
import { DEMO_CREDENTIALS } from '../mock-data';

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: 'manager' | 'staff', restaurantId: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true,

      signIn: async (email: string, password: string) => {
        if (isDemoMode()) {
          // Demo mode authentication
          const demoUser = Object.values(DEMO_CREDENTIALS).find(
            cred => cred.email === email && cred.password === password
          );

          if (demoUser) {
            set({ user: demoUser.user, loading: false });
            return;
          } else {
            throw new Error('Invalid demo credentials. Use manager@demo.com/demo123 or staff@demo.com/demo123');
          }
        }

        // Production mode - use Supabase
        const supabase = createClient();

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        if (authData.user) {
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (profileError) throw profileError;

          set({ user: profile, loading: false });
        }
      },

      signUp: async (email: string, password: string, role: 'manager' | 'staff', restaurantId: string) => {
        const supabase = createClient();

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;

        if (authData.user) {
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: authData.user.id,
              email,
              role,
              restaurant_id: restaurantId,
            })
            .select()
            .single();

          if (profileError) throw profileError;

          set({ user: profile, loading: false });
        }
      },

      signOut: async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        set({ user: null, loading: false });
      },

      initialize: async () => {
        if (isDemoMode()) {
          // In demo mode, just set loading to false - user state should be preserved from login
          set({ loading: false });
          return;
        }

        const supabase = createClient();

        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!error && profile) {
            set({ user: profile, loading: false });
            return;
          }
        }

        set({ user: null, loading: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);