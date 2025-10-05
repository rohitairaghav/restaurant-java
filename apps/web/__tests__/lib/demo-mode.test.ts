import { DEMO_MODE, isDemoMode, DEMO_CONFIG } from '@/lib/demo-mode';

describe('Demo Mode', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('DEMO_MODE constant', () => {
    it('should be true when NEXT_PUBLIC_DEMO_MODE is "true"', () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true';
      
      // Re-import to get the new environment value
      jest.resetModules();
      const { DEMO_MODE } = require('@/lib/demo-mode');
      
      expect(DEMO_MODE).toBe(true);
    });

    it('should be false when NEXT_PUBLIC_DEMO_MODE is not "true"', () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'false';
      
      // Re-import to get the new environment value
      jest.resetModules();
      const { DEMO_MODE } = require('@/lib/demo-mode');
      
      expect(DEMO_MODE).toBe(false);
    });

    it('should be false when NEXT_PUBLIC_DEMO_MODE is undefined', () => {
      delete process.env.NEXT_PUBLIC_DEMO_MODE;
      
      // Re-import to get the new environment value
      jest.resetModules();
      const { DEMO_MODE } = require('@/lib/demo-mode');
      
      expect(DEMO_MODE).toBe(false);
    });

    it('should be false when NEXT_PUBLIC_DEMO_MODE is empty string', () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = '';
      
      // Re-import to get the new environment value
      jest.resetModules();
      const { DEMO_MODE } = require('@/lib/demo-mode');
      
      expect(DEMO_MODE).toBe(false);
    });
  });

  describe('isDemoMode function', () => {
    it('should return true when demo mode is enabled', () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true';
      
      // Re-import to get the new environment value
      jest.resetModules();
      const { isDemoMode } = require('@/lib/demo-mode');
      
      expect(isDemoMode()).toBe(true);
    });

    it('should return false when demo mode is disabled', () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'false';
      
      // Re-import to get the new environment value
      jest.resetModules();
      const { isDemoMode } = require('@/lib/demo-mode');
      
      expect(isDemoMode()).toBe(false);
    });
  });

  describe('DEMO_CONFIG object', () => {
    it('should have correct structure when demo mode is enabled', () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true';
      
      // Re-import to get the new environment value
      jest.resetModules();
      const { DEMO_CONFIG } = require('@/lib/demo-mode');
      
      expect(DEMO_CONFIG).toEqual({
        enabled: true,
        message: '🚀 Demo Mode - Try the app with sample data!',
        credentials: {
          manager: 'manager@demo.com / demo123',
          staff: 'staff@demo.com / demo123',
        },
      });
    });

    it('should have correct structure when demo mode is disabled', () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'false';
      
      // Re-import to get the new environment value
      jest.resetModules();
      const { DEMO_CONFIG } = require('@/lib/demo-mode');
      
      expect(DEMO_CONFIG).toEqual({
        enabled: false,
        message: '🚀 Demo Mode - Try the app with sample data!',
        credentials: {
          manager: 'manager@demo.com / demo123',
          staff: 'staff@demo.com / demo123',
        },
      });
    });

    it('should have demo credentials available', () => {
      expect(DEMO_CONFIG.credentials.manager).toBe('manager@demo.com / demo123');
      expect(DEMO_CONFIG.credentials.staff).toBe('staff@demo.com / demo123');
    });

    it('should have demo message', () => {
      expect(DEMO_CONFIG.message).toBe('🚀 Demo Mode - Try the app with sample data!');
    });
  });

  describe('Production safety', () => {
    it('should throw error when demo mode is enabled in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true';
      
      // Re-import to trigger the error
      jest.resetModules();
      
      expect(() => {
        require('@/lib/demo-mode');
      }).toThrow('Demo mode is not allowed in production environment');
    });

    it('should not throw error when demo mode is disabled in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_DEMO_MODE = 'false';
      
      // Re-import should not throw
      jest.resetModules();
      
      expect(() => {
        require('@/lib/demo-mode');
      }).not.toThrow();
    });

    it('should not throw error when demo mode is undefined in production', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.NEXT_PUBLIC_DEMO_MODE;
      
      // Re-import should not throw
      jest.resetModules();
      
      expect(() => {
        require('@/lib/demo-mode');
      }).not.toThrow();
    });

    it('should not throw error when demo mode is enabled in development', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true';
      
      // Re-import should not throw
      jest.resetModules();
      
      expect(() => {
        require('@/lib/demo-mode');
      }).not.toThrow();
    });

    it('should not throw error when demo mode is enabled in test', () => {
      process.env.NODE_ENV = 'test';
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true';
      
      // Re-import should not throw
      jest.resetModules();
      
      expect(() => {
        require('@/lib/demo-mode');
      }).not.toThrow();
    });
  });
});