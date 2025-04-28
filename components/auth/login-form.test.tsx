import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LoginForm } from './login-form'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn() }),
}))

// Mock Supabase client
const mockSignInWithPassword = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
    // Default mock for successful login
    mockSignInWithPassword.mockResolvedValue({ error: null })
  })

  it('should render the login form elements', () => {
    render(<LoginForm />)

    // Check for title
    expect(screen.getByRole('heading', { name: /login/i, level: 3 })).toBeInTheDocument()

    // Check for email input
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/m@example.com/i)).toBeInTheDocument()

    // Check for password input
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()

    // Check for submit button
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()

    // Check for sign up link
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument()
  })

  it('should show loading state and redirect on successful login', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // Check for loading state
    expect(screen.getByRole('button', { name: /signing in.../i })).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    // Wait for promises to resolve and check for redirection
    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should display an error message on failed login', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Invalid login credentials'
    // Mock failed login for this test
    mockSignInWithPassword.mockResolvedValueOnce({ error: { message: errorMessage } })

    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    // Check button is enabled again and text is back to normal
    expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled()
    expect(screen.queryByRole('button', { name: /signing in.../i })).not.toBeInTheDocument()

    // Ensure redirection did not happen
    expect(mockPush).not.toHaveBeenCalled()
  })

  // Add more tests here (e.g., for form validation if added)
}) 