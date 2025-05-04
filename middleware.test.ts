import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr' // We will mock this
import { middleware, config } from './middleware' // Import the middleware function AND config
import { cookies } from 'next/headers'

// Mock environment variables
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://test-supabase.co')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')

// Mock @supabase/ssr
const mockGetUser = vi.fn()
const mockSupabaseClient = {
  auth: {
    getUser: mockGetUser,
  },
}
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabaseClient),
}))

// Mock NextResponse static methods
vi.mock('next/server', async (importOriginal) => {
  const mod = await importOriginal<typeof import('next/server')>()
  return {
    ...mod,
    NextResponse: {
      ...mod.NextResponse, 
      next: vi.fn(() => ({ cookies: { set: vi.fn(), get: vi.fn() } })), // Mock basic response structure
      redirect: vi.fn((url) => ({ url: url.toString(), status: 307, cookies: { set: vi.fn(), get: vi.fn() } })), // Mock redirect response structure
    },
  }
})

describe('Middleware', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
    mockGetUser.mockReset()
  })

  // Helper to create a mock NextRequest
  const createMockRequest = (pathname: string, cookies: Record<string, string> = {}): NextRequest => {
    const url = new URL(pathname, 'http://localhost:3000');
    // Construct NextRequest directly with the full URL string
    const request = new NextRequest(url.toString());

    // Clear existing default cookies and add mocks
    request.cookies.clear(); // Ensure we start fresh
    Object.entries(cookies).forEach(([name, value]) => {
      request.cookies.set(name, value);
    });
    // Mock the necessary parts of the request used by the middleware
    // We assign directly, accepting the read-only warning in the test context
    // request.nextUrl = url // No longer needed, should be set by constructor
    return request;
  }

  it('should redirect unauthenticated user from /dashboard to /login', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/dashboard')
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    // Act
    const response = await middleware(request)

    // Assert
    expect(response?.status).toBe(307) // 307 is Temporary Redirect
    // Updated assertion to include the query parameter
    const expectedRedirectUrl = new URL('/login', request.url)
    expectedRedirectUrl.searchParams.set('redirect_to', '/dashboard')
    expect(response?.url).toBe(expectedRedirectUrl.toString())
    // Check if NextResponse.redirect was called with the correct URL object
    expect(NextResponse.redirect).toHaveBeenCalledWith(expectedRedirectUrl)
    })

  it('should allow unauthenticated user to access /login', async () => {
    // Arrange
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
      const request = createMockRequest('/login')

    // Act
      await middleware(request)

    // Assert
    expect(NextResponse.redirect).not.toHaveBeenCalled()
    expect(NextResponse.next).toHaveBeenCalled() // Check if the passthrough response was generated
  })

  it('should redirect authenticated user from /login to /dashboard', async () => {
    // Arrange
    const mockUser = { id: '123', email: 'test@test.com' }
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    const request = createMockRequest('/login')

    // Act
    const response = await middleware(request)

    // Assert
    expect(response?.status).toBe(307)
    expect(response?.url).toBe('http://localhost:3000/dashboard')
    expect(NextResponse.redirect).toHaveBeenCalledWith(new URL('/dashboard', request.url))
    })

  it('should allow authenticated user to access /dashboard', async () => {
    // Arrange
    const mockUser = { id: '123', email: 'test@test.com' }
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      const request = createMockRequest('/dashboard')

    // Act
      await middleware(request)

    // Assert
    expect(NextResponse.redirect).not.toHaveBeenCalled()
    expect(NextResponse.next).toHaveBeenCalled()
    })

  // Test the *effect* of the matcher config for static assets
  it('should not run middleware logic for static assets (e.g., logo)', () => {
    // Arrange
    const assetPath = '/ironmark-logo.png'
    const matcherRegex = new RegExp(config.matcher[0]) // Get the regex from the config

    // Act
    const shouldMiddlewareRun = matcherRegex.test(assetPath)

    // Assert
    // We expect the matcher regex to NOT match the asset path
    expect(shouldMiddlewareRun).toBe(false) 
    
    // Since the middleware shouldn't run, we don't call it.
    // We also don't need to assert on NextResponse.redirect or .next
    // because the core assertion is that the path is excluded by the matcher.
    })

  it('should redirect user with invalid refresh token from /dashboard to /login', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/dashboard')
    const mockError = { name: 'AuthApiError', message: 'Invalid Refresh Token' }
    mockGetUser.mockResolvedValue({ data: { user: null }, error: mockError })
    
    // No longer logging warnings in middleware, so we don't need to mock console.warn
    // vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Act
    const response = await middleware(request)

    // Assert
    expect(response?.status).toBe(307)
    // Updated assertion to include the query parameter
    const expectedRedirectUrl = new URL('/login', request.url)
    expectedRedirectUrl.searchParams.set('redirect_to', '/dashboard')
    expect(response?.url).toBe(expectedRedirectUrl.toString())
    // Check if NextResponse.redirect was called with the correct URL object
    expect(NextResponse.redirect).toHaveBeenCalledWith(expectedRedirectUrl)
    
    // We removed console.warn from middleware, so we don't need to test for it anymore
    // expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Invalid Refresh Token'));
    // (console.warn as Mock).mockRestore();
  })

  // Add more tests as needed, e.g., for other public routes or specific error conditions
}) 