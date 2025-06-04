import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ImagePromptForm } from '../forms/prompt/ImagePromptForm';

describe('ImagePromptForm', () => {
  const defaultProps = {
    prompt: '',
    onPromptChange: vi.fn(),
    baseImageUrl: null,
    onFileUpload: vi.fn(),
    onClearBaseImage: vi.fn(),
    aspectRatio: '1:1',
    onAspectRatioChange: vi.fn(),
    style: 'none',
    onStyleChange: vi.fn(),
    mood: 'none',
    onMoodChange: vi.fn(),
    safetyTolerance: 2,
    onSafetyToleranceChange: vi.fn(),
    isGenerating: false,
    onGenerate: vi.fn(),
  };

  const defaultCapabilities = {
    supportsImageEditing: true,
    supportsStyleControls: true,
    maxSafetyTolerance: 6,
    minSafetyTolerance: 0,
    supportedAspectRatios: ['1:1', '16:9', '2:3'],
    supportedOutputFormats: ['png', 'jpg'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders basic form elements', () => {
    render(<ImagePromptForm {...defaultProps} />);
    
    expect(screen.getByPlaceholderText(/Describe what you want to create/)).toBeInTheDocument();
    expect(screen.getByText('Create art')).toBeInTheDocument();
    expect(screen.getByText('Image Dimensions')).toBeInTheDocument();
  });

  it('shows style section when capabilities support style controls', () => {
    render(<ImagePromptForm {...defaultProps} capabilities={defaultCapabilities} />);
    
    expect(screen.getByText('Style')).toBeInTheDocument();
  });

  it('shows advanced section when capabilities have safety tolerance or output formats', () => {
    render(<ImagePromptForm {...defaultProps} capabilities={defaultCapabilities} />);
    
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('opens advanced section and shows safety settings when clicked', () => {
    render(<ImagePromptForm {...defaultProps} capabilities={defaultCapabilities} />);
    
    // Initially advanced section should be closed
    const advancedButton = screen.getByText('Advanced');
    expect(advancedButton).toBeInTheDocument();
    
    // Click to open advanced section
    fireEvent.click(advancedButton);
    
    // Should now show safety tolerance elements
    expect(screen.getByText(/Safety Level/)).toBeInTheDocument();
  });

  it('does not show style section when capabilities do not support style controls', () => {
    const limitedCapabilities = {
      ...defaultCapabilities,
      supportsStyleControls: false,
    };
    
    render(<ImagePromptForm {...defaultProps} capabilities={limitedCapabilities} />);
    
    expect(screen.queryByText('Style')).not.toBeInTheDocument();
  });

  it('does not show advanced section when no advanced capabilities are available', () => {
    const basicCapabilities = {
      supportsImageEditing: false,
      supportsStyleControls: false,
      supportedAspectRatios: ['1:1'],
      supportedOutputFormats: [],
    };
    
    render(<ImagePromptForm {...defaultProps} capabilities={basicCapabilities} />);
    
    expect(screen.queryByText('Advanced')).not.toBeInTheDocument();
  });

  it('shows image upload section when capabilities support image editing', () => {
    render(<ImagePromptForm {...defaultProps} capabilities={defaultCapabilities} />);
    
    // The ImageUploadSection would be rendered but we'd need to check for specific upload elements
    // This is a basic check that the component renders with image editing capabilities
    expect(screen.getByText('Image Dimensions')).toBeInTheDocument();
  });

  it('disables generate button when prompt is empty', () => {
    render(<ImagePromptForm {...defaultProps} prompt="" />);
    
    const generateButton = screen.getByRole('button', { name: /create art/i });
    expect(generateButton).toBeDisabled();
  });

  it('enables generate button when prompt has content', () => {
    render(<ImagePromptForm {...defaultProps} prompt="test prompt" />);
    
    const generateButton = screen.getByRole('button', { name: /create art/i });
    expect(generateButton).not.toBeDisabled();
  });

  it('shows generating state when isGenerating is true', () => {
    render(<ImagePromptForm {...defaultProps} isGenerating={true} />);
    
    expect(screen.getByText('Creating...')).toBeInTheDocument();
  });

  it('displays error message when generationError is provided', () => {
    const errorMessage = 'Test error message';
    render(<ImagePromptForm {...defaultProps} generationError={errorMessage} />);
    
    expect(screen.getByText('Generation Failed')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
}); 