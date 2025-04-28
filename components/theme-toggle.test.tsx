import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ThemeToggle } from './theme-toggle'

// Mock next-themes
const mockSetTheme = vi.fn()
vi.mock('next-themes', () => ({
  useTheme: () => ({
    setTheme: mockSetTheme,
    // Provide other properties if the component uses them (e.g., theme, systemTheme)
    theme: 'system', // Default mock theme
    systemTheme: 'light', // Default mock systemTheme
  }),
}))

describe('ThemeToggle', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
  })

  it('should render the trigger button with icons', () => {
    render(<ThemeToggle />)
    
    // Find the button (it has screen-reader text)
    const triggerButton = screen.getByRole('button', { name: /toggle theme/i })
    expect(triggerButton).toBeInTheDocument()

    // Check for icons (presence might be enough, or check class names)
    // Note: Checking specific SVG content is brittle. Checking existence is usually sufficient.
    expect(triggerButton.querySelector('svg.lucide-sun')).toBeInTheDocument()
    expect(triggerButton.querySelector('svg.lucide-moon')).toBeInTheDocument()
  })

  it('should open dropdown menu on trigger click', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const triggerButton = screen.getByRole('button', { name: /toggle theme/i })
    await user.click(triggerButton)

    // Check for menu items after opening
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /light/i })).toBeInTheDocument()
      expect(screen.getByRole('menuitem', { name: /dark/i })).toBeInTheDocument()
      expect(screen.getByRole('menuitem', { name: /system/i })).toBeInTheDocument()
    })
  })

  it('should call setTheme with "light" when Light item is clicked', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const triggerButton = screen.getByRole('button', { name: /toggle theme/i })
    await user.click(triggerButton)

    const lightMenuItem = await screen.findByRole('menuitem', { name: /light/i })
    await user.click(lightMenuItem)

    expect(mockSetTheme).toHaveBeenCalledTimes(1)
    expect(mockSetTheme).toHaveBeenCalledWith('light')
  })

  it('should call setTheme with "dark" when Dark item is clicked', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const triggerButton = screen.getByRole('button', { name: /toggle theme/i })
    await user.click(triggerButton)

    const darkMenuItem = await screen.findByRole('menuitem', { name: /dark/i })
    await user.click(darkMenuItem)

    expect(mockSetTheme).toHaveBeenCalledTimes(1)
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })

  it('should call setTheme with "system" when System item is clicked', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const triggerButton = screen.getByRole('button', { name: /toggle theme/i })
    await user.click(triggerButton)

    const systemMenuItem = await screen.findByRole('menuitem', { name: /system/i })
    await user.click(systemMenuItem)

    expect(mockSetTheme).toHaveBeenCalledTimes(1)
    expect(mockSetTheme).toHaveBeenCalledWith('system')
  })
}) 