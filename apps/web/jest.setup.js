import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/dashboard',
}))

// Mock jose library to prevent ESM issues
jest.mock('jose', () => ({
  compactDecrypt: jest.fn(),
  compactSign: jest.fn(),
  decodeJwt: jest.fn(),
  jwtVerify: jest.fn(),
  SignJWT: jest.fn(),
  importJWK: jest.fn(),
  exportJWK: jest.fn(),
}))

// Supabase will be mocked in individual test files

// Mock IndexedDB for offline tests
global.indexedDB = require('fake-indexeddb')
global.IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange')

// Mock browser APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})