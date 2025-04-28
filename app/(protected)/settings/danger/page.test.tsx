import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DangerPage from './page';

// Mock the actual DangerZone component
vi.mock('@/components/settings/danger-zone', () => ({
  DangerZone: vi.fn(() => <div>Mocked Danger Zone</div>), 
}));

describe('DangerPage', () => {
  it('renders the DangerZone component', () => {
    render(<DangerPage />);
    // Check if the mocked component's content is present
    expect(screen.getByText('Mocked Danger Zone')).toBeInTheDocument();
  });
}); 