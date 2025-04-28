import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProfilePage from './page'; // Adjust the import path if needed

// Mock the actual ProfileForm component
vi.mock('@/components/settings/profile-form', () => ({
  ProfileForm: vi.fn(() => <div>Mocked Profile Form</div>), // Simple mock rendering text
}));

describe('ProfilePage', () => {
  it('renders the ProfileForm component', async () => {
    render(<ProfilePage />);

    // Check if the mocked component's content is present
    // Use waitFor if the ProfileForm itself has async operations for rendering
    await waitFor(() => {
      expect(screen.getByText('Mocked Profile Form')).toBeInTheDocument();
    });
  });
}); 