import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User, Session } from "@supabase/supabase-js"
import { NavUser } from './nav-user'
import { SidebarProvider } from '@/components/ui/sidebar'

// --- Mocks ---

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}))

// Store the listener callback and the session to simulate
let authChangeListener: ((event: string, session: Session | null) => void) | null = null;
let simulatedSession: Session | null | undefined = undefined; // Use undefined to track if set

// Mock Supabase client
// const mockGetUser = vi.fn() // No longer needed
const mockSignOut = vi.fn()
const mockUnsubscribe = vi.fn()
const mockOnAuthStateChange = vi.fn((callback) => {
  // Capture the listener callback
  authChangeListener = callback;
  // DO NOT call immediately here. Let the test control the call via act.
  return {
    data: {
      subscription: {
        unsubscribe: mockUnsubscribe,
      },
    },
  }
})

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
     // getUser: mockGetUser, // No longer needed
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
}))

// Mock useSidebar hook
const mockUseSidebar = vi.fn()
vi.mock('@/components/ui/sidebar', async (importOriginal) => {
  const mod = await importOriginal<Record<string, unknown>>() 
  const localMockUseSidebar = vi.fn(() => mockUseSidebar());
  localMockUseSidebar.mockImplementation(() => mockUseSidebar());
  return {
    ...mod, 
    useSidebar: localMockUseSidebar, 
  }
})

// Helper function to TRIGGER the captured listener callback
const triggerAuthStateChange = (session: Session | null) => {
  if (authChangeListener) {
    // Directly call the captured listener
    authChangeListener('SIGNED_IN', session); 
  } else {
    // This might happen if component unmounts before listener is set
    console.warn('Auth change listener not captured or component unmounted early.');
  }
};

// --- Test Suite ---

describe('NavUser', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    return render(<SidebarProvider>{component}</SidebarProvider>)
  }

  // Define mock user data centrally
  const mockUser: User = {
    id: '123',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] }, // Add required fields
    user_metadata: { name: 'Test User', avatar_url: 'http://example.com/avatar.png'},
    identities: [], // Add required fields
    factors: [], // Add required fields
    email_confirmed_at: new Date().toISOString(), // Add required fields
    phone: '', // Add required fields
    last_sign_in_at: new Date().toISOString(), // Add required fields
  };
  
  const mockSession: Session = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: mockUser,
    expires_at: Date.now() + 3600 * 1000, // Add required fields
  };

  beforeEach(() => {
    vi.clearAllMocks()
    authChangeListener = null; // Reset listener capture
    // simulatedSession = undefined; // Reset session simulation state if needed
    mockSignOut.mockResolvedValue({ error: null })
    mockUseSidebar.mockReturnValue({ isMobile: false }) 
  })

  it('should render skeleton initially', () => {
    renderWithProvider(<NavUser />)
    // Initially, before listener fires, skeleton should be present
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument() 
    expect(screen.queryByText('Test User')).not.toBeInTheDocument();
  })
}) 