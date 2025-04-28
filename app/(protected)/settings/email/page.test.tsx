import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EmailPage from './page';

// Mock the actual EmailForm component
vi.mock('@/components/settings/email-form', () => ({
  EmailForm: vi.fn(() => <div>Mocked Email Form</div>),
}));

describe('EmailPage', () => {
  it('renders the EmailForm component', () => {
    render(<EmailPage />);
    // Check if the mocked component's content is present
    expect(screen.getByText('Mocked Email Form')).toBeInTheDocument();
  });
}); 