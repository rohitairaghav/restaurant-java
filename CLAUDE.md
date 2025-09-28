# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Restaurant Inventory Management System - A hybrid web and mobile application for managing restaurant inventory with offline-first capabilities, real-time alerts, and analytics.

## Development Commands

### Root Level
- `npm run dev:web` - Start web development server
- `npm run dev:mobile` - Start mobile development server (Expo)
- `npm run build:web` - Build web application
- `npm run build:mobile` - Build mobile application
- `npm run test` - Run tests across all packages
- `npm run test:coverage` - Run tests with coverage reports
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run linting across all packages
- `npm run type-check` - Run TypeScript checking
- `./scripts/test.sh` - Run tests with detailed output
- `./scripts/test.sh --coverage` - Run tests with coverage
- `./scripts/test.sh --watch` - Run tests in watch mode

### Web App (apps/web)
- `npm run dev` - Start Next.js development server (localhost:3000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Mobile App (apps/mobile)
- `npx expo start` - Start Expo development server
- `npx expo start --ios` - Start iOS simulator
- `npx expo start --android` - Start Android emulator
- `eas build --platform all --profile development` - Build development version
- `eas build --platform all --profile preview` - Build preview version

## Architecture

### Tech Stack
- **Frontend**: React (Web) + React Native with Expo (Mobile)
- **UI**: TailwindCSS (web) + NativeWind (mobile)
- **State Management**: Zustand
- **Backend**: Supabase (Postgres, Auth, Storage, Edge Functions)
- **Offline Support**: IndexedDB (web) + SQLite (mobile)
- **Deployment**: Vercel (web) + EAS Build (mobile)

### Project Structure
```
├── apps/
│   ├── web/           # Next.js web application
│   └── mobile/        # Expo React Native app
├── packages/
│   └── shared/        # Shared types, utilities, constants
├── supabase/          # Database schema and migrations
└── .github/workflows/ # CI/CD pipelines
```

### Database Schema
- `restaurants` - Restaurant information
- `user_profiles` - User roles and restaurant associations
- `suppliers` - Supplier information
- `inventory_items` - Product inventory with stock levels
- `stock_transactions` - Stock in/out transactions with audit trail
- `alerts` - Low stock and out-of-stock notifications

### Key Features Implementation
1. **Inventory Management**: CRUD operations with role-based access (Manager/Staff)
2. **Stock Tracking**: Real-time stock in/out with automatic balance calculation
3. **Low-Stock Alerts**: Automatic triggers with real-time notifications
4. **Analytics**: Usage reports and inventory value tracking
5. **Offline-First**: Local storage with sync on reconnection
6. **Multi-User Roles**: Manager (full access) vs Staff (limited access)

### Offline Strategy
- **Web**: IndexedDB with Dexie.js for local caching
- **Mobile**: SQLite with expo-sqlite for offline transactions
- **Sync**: Automatic sync on reconnection with conflict resolution

### Environment Variables
**Web (.env.local)**:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Mobile (.env)**:
```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Development Workflow

### Planning and Execution
1. Think through the problem and read relevant codebase files
2. Create a plan with todo items that can be checked off
3. Get plan verification before beginning work
4. Work on todo items, marking them complete as you go
5. Provide high-level explanations of changes at each step
6. Keep all changes simple and minimal - avoid complex modifications

### Code Standards
- Follow existing patterns in components and stores
- Use TypeScript strictly - avoid `any` types
- Implement proper error handling and loading states
- Follow the established folder structure
- Use shared types from `packages/shared`

### Database Changes
- Update `supabase/schema.sql` for schema changes
- Test with sample data in `supabase/seed.sql`
- Update TypeScript types in `packages/shared/types.ts`

### State Management
- Use Zustand stores for global state
- Implement offline-first patterns in stores
- Handle loading and error states consistently

## Testing

### Test Coverage
- **Target**: 80% minimum coverage across all packages
- **Current Coverage**: Comprehensive tests for utilities, stores, components, and offline functionality
- **Coverage Reports**: Generated in `coverage/` directories

### Test Structure
```
__tests__/
├── components/        # Component tests
├── stores/           # Zustand store tests
└── lib/              # Utility and service tests
```

### Running Tests
- `npm run test` - Run all tests
- `npm run test:coverage` - Generate coverage reports
- `npm run test:watch` - Watch mode for development
- `./scripts/test.sh --coverage` - Detailed test runner

### Test Categories
1. **Unit Tests**: Utilities, constants, and pure functions
2. **Store Tests**: Zustand state management logic
3. **Component Tests**: React component behavior and interactions
4. **Integration Tests**: Offline sync and database operations

## Database Management (Liquibase)

The project uses Liquibase for versioned database schema management:

### Database Commands
- `npm run db:setup` - Validate Liquibase setup and download drivers
- `npm run db:status` - Check pending database changes
- `npm run db:update` - Apply all pending changes to database
- `npm run db:rollback` - Rollback the last changeset
- `npm run db:validate` - Validate changelog syntax
- `npm run db:history` - Show applied change history

### Database Structure
- `supabase/liquibase/` - Liquibase configuration and changesets
- `supabase/liquibase/changelogs/v1.0.0/` - Version 1.0.0 schema changes
- `supabase/schema.sql` - Legacy schema (migrated to Liquibase)

### Workflow
1. Update `supabase/liquibase/liquibase.properties` with your Supabase credentials
2. Run `npm run db:setup` to validate configuration
3. Run `npm run db:update` to apply schema changes
4. All changes are versioned and tracked automatically

## Important Files

- `.claude.md` - Detailed development rules and practices
- `packages/shared/types.ts` - Shared TypeScript definitions
- `supabase/liquibase/` - Database schema management with Liquibase
- `supabase/schema.sql` - Legacy database schema (use Liquibase instead)
- `apps/web/lib/stores/` - Zustand state management
- `apps/web/lib/offline/` - Offline functionality
- `apps/mobile/lib/offline/` - Mobile offline database
- `__tests__/` - Test suites for all components and utilities
- `jest.config.js` - Jest configuration files
- `codecov.yml` - Coverage reporting configuration