import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PasswordPage from './page'; // Adjust the import path if needed

// Mock the actual PasswordForm component
vi.mock('@/components/settings/password-form', () => ({
  PasswordForm: vi.fn(() => <div>Mocked Password Form</div>), // Simple mock rendering text
}));

describe('PasswordPage', () => {
  it('renders the PasswordForm component', async () => {
    render(<PasswordPage />);

    // Check if the mocked component's content is present
    // Use waitFor if the PasswordForm itself has async operations for rendering
    await waitFor(() => {
      expect(screen.getByText('Mocked Password Form')).toBeInTheDocument();
    });
  });
}); 