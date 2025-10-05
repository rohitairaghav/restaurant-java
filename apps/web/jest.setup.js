import '@testing-library/jest-dom'

// Polyfill Request and Response for test environment
if (!global.Request) {
  global.Request = class Request {
    constructor(url, init) {
      this._url = url;
      this._init = init;
    }
    get url() { return this._url; }
    get init() { return this._init; }
    async json() { return {}; }
  };
}
global.Response = global.Response || class Response {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.statusText = init?.statusText || 'OK';
    this.headers = init?.headers || new Map();
  }
  async json() { return {}; }
  async text() { return ''; }
};

// Mock NextResponse
global.NextResponse = class NextResponse extends global.Response {
  static json(data, init) {
    return new NextResponse(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  }
  
  static redirect(url, init) {
    return new NextResponse(null, {
      ...init,
      status: init?.status || 302,
      headers: {
        'Location': url,
        ...init?.headers,
      },
    });
  }
};

// Mock RequestCookies to avoid conflicts
global.RequestCookies = class RequestCookies {
  constructor(cookies) {
    this._cookies = new Map();
    if (cookies) {
      // Handle the case where cookies are passed as an array or object
      if (Array.isArray(cookies)) {
        cookies.forEach(cookie => {
          if (cookie && cookie.name && cookie.value) {
            this._cookies.set(cookie.name, cookie.value);
          }
        });
      }
    }
  }
  get(name) {
    return this._cookies.get(name);
  }
  set(name, value) {
    this._cookies.set(name, value);
  }
  getAll() {
    return Array.from(this._cookies.entries()).map(([name, value]) => ({ name, value }));
  }
  has(name) {
    return this._cookies.has(name);
  }
  delete(name) {
    return this._cookies.delete(name);
  }
};

// Mock NextRequest to avoid conflicts
global.NextRequest = class NextRequest extends global.Request {
  constructor(url, init) {
    super(url, init);
    this.cookies = new global.RequestCookies();
  }
};

// Mock the Next.js edge runtime cookies module
jest.mock('next/dist/compiled/@edge-runtime/cookies', () => ({
  RequestCookies: global.RequestCookies,
}));

// Mock Next.js server modules
jest.mock('next/server', () => ({
  NextRequest: global.NextRequest,
  NextResponse: global.NextResponse,
}));

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