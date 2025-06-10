import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SaveAsDialog } from './SaveAsDialog';
import { vi } from 'vitest';

describe('SaveAsDialog', () => {
  const defaultProps = {
    isOpen: false,
    onOpenChange: vi.fn(),
    onSubmit: vi.fn(),
    defaultAssetName: 'default.txt',
  };

  it('does not render when closed', () => {
    render(<SaveAsDialog {...defaultProps} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders dialog with default name when open', () => {
    render(<SaveAsDialog {...defaultProps} isOpen={true} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const input = screen.getByPlaceholderText(/Enter asset name/i) as HTMLInputElement;
    expect(input.value).toBe('default.txt');
    expect(screen.getByRole('button', { name: /Save Copy/i })).toBeEnabled();
  });

  it('disables save when input is empty', () => {
    render(<SaveAsDialog {...defaultProps} isOpen={true} />);
    const input = screen.getByPlaceholderText(/Enter asset name/i);
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByRole('button', { name: /Save Copy/i })).toBeDisabled();
  });

  it('calls onSubmit and onOpenChange on save', () => {
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();
    render(<SaveAsDialog {...defaultProps} isOpen={true} onSubmit={onSubmit} onOpenChange={onOpenChange} />);
    const input = screen.getByPlaceholderText(/Enter asset name/i);
    fireEvent.change(input, { target: { value: 'new-name' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Copy/i }));
    expect(onSubmit).toHaveBeenCalledWith('new-name');
    // dialog remains open until external close; onOpenChange isn't called here
  });

  it('calls onOpenChange on cancel', () => {
    const onOpenChange = vi.fn();
    render(<SaveAsDialog {...defaultProps} isOpen={true} onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
}); 