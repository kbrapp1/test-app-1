import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SiteHeader } from './site-header'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/', // Default mock pathname
  useSearchParams: () => new URLSearchParams(), // Default mock searchParams
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    // Add other router methods if needed by the component during tests
  }),
}));

// Mock child components to isolate SiteHeader logic
vi.mock('./theme-toggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle-mock">ThemeToggle</div>,
}))

vi.mock('@/components/ui/sidebar', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/components/ui/sidebar')>()
  return {
    ...mod,
    // Keep other exports, mock only SidebarTrigger
    SidebarTrigger: ({ className }: { className?: string }) => (
      <button className={className} data-testid="sidebar-trigger-mock">Trigger</button>
    ),
  }
})

describe('SiteHeader', () => {
  it('should render without crashing', () => {
    render(<SiteHeader />)
    // Implicit assertion: no error thrown
  })

  it('should render the ThemeToggle component', () => {
    render(<SiteHeader />)
    expect(screen.getByTestId('theme-toggle-mock')).toBeInTheDocument()
  })

  it('should render the SidebarTrigger component', () => {
    render(<SiteHeader />)
    expect(screen.getByTestId('sidebar-trigger-mock')).toBeInTheDocument()
    // Check for the specific class passed to it if needed
    // expect(screen.getByTestId('sidebar-trigger-mock')).toHaveClass('-ml-1')
  })
}) 