# Restaurant Inventory Management System

A modern, hybrid web and mobile application for managing restaurant inventory with offline-first capabilities, real-time alerts, and comprehensive analytics.

## Features

### MVP Features ✅
- **Inventory Management**: Add/edit/delete items with categories, units, suppliers, and costs
- **Stock Tracking**: Track stock in (purchases, deliveries) and out (sales, waste, transfers)
- **Low-Stock Alerts**: Real-time alerts with configurable minimum thresholds
- **Basic Analytics**: Daily/weekly usage reports and cost tracking
- **Multi-User Roles**: Manager (full access) vs Staff (limited access)
- **Offline-First**: Staff can record transactions offline with automatic sync

## Tech Stack

### Frontend
- **Web**: React with Next.js 14 + TailwindCSS
- **Mobile**: React Native with Expo + NativeWind
- **State Management**: Zustand
- **UI Components**: Lucide React icons

### Backend & Database
- **Backend**: Supabase (all-in-one solution)
- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth with role-based access
- **Real-time**: Supabase real-time subscriptions

### Offline Support
- **Web**: IndexedDB with Dexie.js
- **Mobile**: SQLite with expo-sqlite
- **Sync**: Automatic sync on reconnection

### Deployment
- **Web**: Vercel with GitHub Actions
- **Mobile**: EAS Build for iOS/Android
- **Backend**: Supabase (fully managed)

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (for mobile development)
- Supabase account

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd restaurant-nextgen
   npm install
   ```

2. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL from `supabase/schema.sql` in the SQL editor
   - Optionally run `supabase/seed.sql` for sample data

3. **Configure environment variables**

   **Web app** (`apps/web/.env.local`):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

   **Mobile app** (`apps/mobile/.env`):
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Start development servers**
   ```bash
   # Web app
   npm run dev:web

   # Mobile app
   npm run dev:mobile
   ```

## Development

### Commands
- `npm run dev:web` - Start web development server
- `npm run dev:mobile` - Start mobile development server
- `npm run build:web` - Build web application
- `npm run lint` - Run linting
- `npm run type-check` - TypeScript checking

### Project Structure
```
├── apps/
│   ├── web/           # Next.js web application
│   │   ├── app/       # Next.js 14 app directory
│   │   ├── components/# React components
│   │   └── lib/       # Utilities, stores, offline logic
│   └── mobile/        # Expo React Native app
│       ├── app/       # Expo Router pages
│       ├── components/# React Native components
│       └── lib/       # Mobile-specific utilities
├── packages/
│   └── shared/        # Shared types, utilities, constants
├── supabase/          # Database schema and seed data
└── .github/workflows/ # CI/CD pipelines
```

## Database Schema

### Core Tables
- `restaurants` - Restaurant information
- `user_profiles` - User accounts with role-based access
- `suppliers` - Supplier contact information
- `inventory_items` - Products with stock levels and thresholds
- `stock_transactions` - Complete audit trail of stock movements
- `alerts` - Low stock and out-of-stock notifications

### Key Features
- **Row Level Security (RLS)** - Data isolation by restaurant
- **Automatic triggers** - Stock balance updates and alert generation
- **Real-time subscriptions** - Live updates for alerts and stock changes

## User Roles

### Manager
- Full inventory CRUD operations
- View analytics and reports
- Manage suppliers
- Access all features

### Staff
- Add/update stock transactions
- View inventory levels
- Receive alerts
- Limited to operational tasks

## Offline Capabilities

### Web App
- **IndexedDB** for local storage
- **Dexie.js** for database operations
- **Automatic sync** on reconnection
- **Visual indicators** for online/offline status

### Mobile App
- **SQLite** for local transactions
- **expo-sqlite** for database operations
- **Background sync** when connectivity restored
- **Offline transaction queue**

## Deployment

### Web App (Vercel)
```bash
cd apps/web
npm run build
# Deploy automatically via GitHub Actions
```

### Mobile App (EAS Build)
```bash
cd apps/mobile
eas build --platform all --profile preview
```

## Contributing

1. Follow the existing code patterns
2. Use TypeScript strictly
3. Test offline functionality
4. Update documentation for new features
5. Ensure proper error handling

## License

MIT License - see LICENSE file for details