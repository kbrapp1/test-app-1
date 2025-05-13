import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { AddTeamMemberDialog } from './AddTeamMemberDialog';
import { useUser } from '@/lib/hooks/useUser';
import userEvent from '@testing-library/user-event';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock the useUser hook with the new structure that includes auth object
vi.mock('@/lib/hooks/useUser', () => ({
  useUser: vi.fn(() => ({
    auth: {
      isAdmin: false,
      isEditor: false,
      isViewer: false,
    },
    isLoading: false,
  })),
}));

const renderWithTooltip = (ui: React.ReactElement) => {
  return render(
    <TooltipProvider>
      {ui}
    </TooltipProvider>
  );
};

describe('AddTeamMemberDialog', () => {
  it('shows disabled button with tooltip for non-admin users', async () => {
    renderWithTooltip(<AddTeamMemberDialog />);
    
    // Button should be disabled
    const button = screen.getByRole('button', { name: /add team member/i });
    expect(button).toBeDisabled();
    
    // Hover over the button to show tooltip
    await userEvent.hover(button);
    
    // Wait for tooltip to appear and verify its content
    const tooltipContent = await screen.findByRole('tooltip');
    expect(tooltipContent).toHaveTextContent(/only administrators can add team members/i);
  });

  it('shows enabled button and dialog for admin users', () => {
    // Mock the useUser hook to return admin status in the auth object
    (useUser as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        isAdmin: true,
        isEditor: false,
        isViewer: false,
      },
      isLoading: false,
    });

    renderWithTooltip(<AddTeamMemberDialog />);
    
    // Button should be enabled
    const button = screen.getByRole('button', { name: /add team member/i });
    expect(button).not.toBeDisabled();
  });

  it('shows disabled button with loading tooltip while loading', async () => {
    // Mock the useUser hook to return loading state
    (useUser as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        isAdmin: false,
        isEditor: false,
        isViewer: false,
      },
      isLoading: true,
    });

    renderWithTooltip(<AddTeamMemberDialog />);
    
    // Button should be present and disabled
    const button = screen.getByRole('button', { name: /add team member/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();

    // Hover over the button to show tooltip
    await userEvent.hover(button);
    
    // Wait for tooltip to appear and verify its content
    const tooltipContent = await screen.findByRole('tooltip');
    expect(tooltipContent).toHaveTextContent(/loading.../i);
  });
}); 