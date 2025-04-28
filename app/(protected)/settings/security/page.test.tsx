import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SecurityPage from './page';

// Mock the actual SecuritySection component
vi.mock('@/components/settings/security-section', () => ({
  SecuritySection: vi.fn(() => <div>Mocked Security Section</div>),
}));

describe('SecurityPage', () => {
  it('renders the SecuritySection component', () => {
    render(<SecurityPage />);
    // Check if the mocked component's content is present
    expect(screen.getByText('Mocked Security Section')).toBeInTheDocument();
  });
}); 