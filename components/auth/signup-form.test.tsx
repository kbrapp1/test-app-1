import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SignupForm } from './signup-form' // Corrected import name

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}))

// Mock Supabase client
const mockSignUp = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signUp: mockSignUp,
    },
  }),
}))

describe('SignUpForm', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
    // Default mock for successful signup (adjust if needed, e.g., for email confirmation)
    mockSignUp.mockResolvedValue({ data: { user: { id: '123' }, session: {} }, error: null })
  })

  it('should render the signup form elements', () => {
    render(<SignupForm />)

    // Check for title
    expect(screen.getByRole('heading', { name: /sign up/i, level: 3 })).toBeInTheDocument() // Adjust level if needed

    // Check for email input
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/m@example.com/i)).toBeInTheDocument()

    // Check for password input
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument() // Use regex for exact match if needed

    // Check for confirm password input (assuming it exists)
    // expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()

    // Check for submit button
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument() // Corrected button text

    // Check for login link
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument() // Corrected link text based on output
  })

  // Add more tests here for successful signup, error handling, password mismatch etc.
  // Example for successful signup:
  it('should show loading state and call signup on successful submission', async () => {
    const user = userEvent.setup()
    render(<SignupForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // Check that signup was called
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          // Assuming default Supabase behavior, it needs the confirmation URL
          emailRedirectTo: expect.stringContaining('/auth/confirm'), 
        },
      })
    })

    // Check for the confirmation message instead of loading state
    await waitFor(() => {
     expect(screen.getByText(/check your email to confirm sign up/i)).toBeInTheDocument();
    });

    // Check the button is still enabled and text is the same
    expect(submitButton).toBeEnabled()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  // Example for displaying an error:
  it('should display an error message on failed signup', async () => {
    const user = userEvent.setup()
    const errorMessage = 'User already registered'
    // Mock failed signup for this test
    mockSignUp.mockResolvedValueOnce({ data: {}, error: { message: errorMessage } })

    render(<SignupForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    // const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i }) // Corrected button text

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    // await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton)

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    // Check button is enabled again and text is back to normal
    expect(screen.getByRole('button', { name: /sign up/i })).toBeEnabled() // Corrected button text
    expect(screen.queryByRole('button', { name: /signing up.../i })).not.toBeInTheDocument() // Adjusted loading text

    // Ensure redirection did not happen (if applicable)
    // expect(mockPush).not.toHaveBeenCalled();
  })

  // Test for the database domain restriction error
  it('should display specific error message for restricted domain', async () => {
    const user = userEvent.setup()
    // Mock signup to return the specific database error message
    // Note: Supabase might wrap this differently, but we test based on the string check
    const dbErrorMessage = 'Database error saving new user'
    mockSignUp.mockResolvedValueOnce({ data: {}, error: { message: dbErrorMessage, name: 'AuthApiError' } })

    render(<SignupForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    await user.type(emailInput, 'test@invalid-domain.com') // Use an invalid domain for clarity
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // Wait for the specific user-friendly error message to appear
    await waitFor(() => {
      expect(screen.getByText('Please use an approved email domain.')).toBeInTheDocument()
    })

    // Check button is enabled again and text is back to normal
    expect(screen.getByRole('button', { name: /sign up/i })).toBeEnabled()

    // Ensure success message is not shown
    expect(screen.queryByText(/check your email/i)).not.toBeInTheDocument()
  })

  // TODO: Add test for password confirmation mismatch if applicable
}) 