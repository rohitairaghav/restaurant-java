// Demo mode configuration
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export const isDemoMode = () => DEMO_MODE;

// Demo mode banner component props
export const DEMO_CONFIG = {
  enabled: DEMO_MODE,
  message: '🚀 Demo Mode - Try the app with sample data!',
  credentials: {
    manager: 'manager@demo.com / demo123',
    staff: 'staff@demo.com / demo123',
  },
};