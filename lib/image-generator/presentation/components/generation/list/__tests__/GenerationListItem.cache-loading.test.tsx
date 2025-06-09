import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GenerationListItem } from '../GenerationListItem';
import { GenerationDto } from '../../../../../application/dto';

// Mock the image optimization hook
vi.mock('../../../../utils/imageOptimization', () => ({
  useOptimizedImage: (url: string) => url + '?w=200&h=200&q=85'
}));

// Mock the formatter utils
vi.mock('../../../../utils/generationFormatters', () => ({
  getStatusColor: () => 'text-green-600',
  getStatusText: () => 'Completed',
  formatDate: () => '2 mins ago',
  truncatePrompt: (prompt: string) => prompt.slice(0, 50)
}));

// Mock GenerationActionButtons
vi.mock('../../../forms/controls/GenerationActionButtons', () => ({
  GenerationActionButtons: () => <div data-testid="action-buttons">Action Buttons</div>
}));

describe('GenerationListItem - Cache-Aware Loading', () => {
  const mockGeneration: GenerationDto = {
    id: 'gen_123',
    prompt: 'A cat in space',
    imageUrl: 'https://replicate.delivery/test-image.webp',
    status: 'completed',
    width: 1024,
    height: 1024,
    aspectRatio: '1:1',
    costCents: 100,
    createdAt: '2024-01-01T12:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
    savedToDAM: false,
    editType: 'text-to-image',
    modelName: 'flux-kontext-max'
  };

  const defaultProps = {
    generation: mockGeneration,
    onImageClick: vi.fn(),
    onEditClick: vi.fn(),
    onCopyUrl: vi.fn(),
    onDownloadImage: vi.fn(),
    onMakeBaseImage: vi.fn()
  };

  const OriginalImage = global.Image;
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.Image = OriginalImage;
  });

  describe('Cache Detection and Loading States', () => {
    it('should detect cached images and show immediately with opacity-100', () => {
      // Mock cached image
      global.Image = vi.fn().mockImplementation(() => ({
        complete: true,
        naturalWidth: 1024,
        src: '',
        crossOrigin: ''
      })) as any;

      render(<GenerationListItem {...defaultProps} />);

      // Should show main image immediately
      const mainImage = screen.getByAltText('A cat in space');
      expect(mainImage).toHaveClass('opacity-100');
    });

    it('should detect uncached images and start with opacity-0', () => {
      // Mock uncached image
      global.Image = vi.fn().mockImplementation(() => ({
        complete: false,
        naturalWidth: 0,
        src: '',
        crossOrigin: '',
        onload: null,
        onerror: null
      })) as any;

      render(<GenerationListItem {...defaultProps} />);

      // Should show main image with opacity-0 initially
      const mainImage = screen.getByAltText('A cat in space');
      expect(mainImage).toHaveClass('opacity-0');
    });

    it('should transition to visible after image loads', async () => {
      global.Image = vi.fn().mockImplementation(() => ({
        complete: false,
        naturalWidth: 0,
        src: '',
        crossOrigin: '',
        onload: null,
        onerror: null
      })) as any;

      render(<GenerationListItem {...defaultProps} />);

      const mainImage = screen.getByAltText('A cat in space');
      
      // Initially hidden
      expect(mainImage).toHaveClass('opacity-0');

      // Simulate image load
      fireEvent.load(mainImage);

      await waitFor(() => {
        expect(mainImage).toHaveClass('opacity-100');
      });
    });
  });

  describe('Different Generation Status Handling', () => {
    it('should not render image element for failed generations', () => {
      const failedGeneration = { ...mockGeneration, status: 'failed' as const };
      render(<GenerationListItem {...defaultProps} generation={failedGeneration} />);

      // Should not show main image
      expect(screen.queryByAltText('A cat in space')).not.toBeInTheDocument();
      // But prompt should still show in the text content
      expect(screen.getByText('A cat in space')).toBeInTheDocument();
    });

    it('should not render image element for processing generations', () => {
      const processingGeneration = { ...mockGeneration, status: 'processing' as const };
      render(<GenerationListItem {...defaultProps} generation={processingGeneration} />);

      expect(screen.queryByAltText('A cat in space')).not.toBeInTheDocument();
      expect(screen.getByText('A cat in space')).toBeInTheDocument();
    });

    it('should not render image element for pending generations', () => {
      const pendingGeneration = { ...mockGeneration, status: 'pending' as const };
      render(<GenerationListItem {...defaultProps} generation={pendingGeneration} />);

      expect(screen.queryByAltText('A cat in space')).not.toBeInTheDocument();
      expect(screen.getByText('A cat in space')).toBeInTheDocument();
    });
  });

  describe('Cache Detection Logic', () => {
    it('should handle generation changes and maintain proper state', () => {
      global.Image = vi.fn().mockImplementation(() => ({
        complete: false,
        naturalWidth: 0,
        src: '',
        crossOrigin: ''
      })) as any;

      const { rerender } = render(<GenerationListItem {...defaultProps} />);

      // First generation
      let mainImage = screen.getByAltText('A cat in space');
      expect(mainImage).toBeInTheDocument();

      // Change to different generation
      const newGeneration = { ...mockGeneration, id: 'gen_456', prompt: 'A dog in space' };
      rerender(<GenerationListItem {...defaultProps} generation={newGeneration} />);

      // Should show new generation
      const newMainImage = screen.getByAltText('A dog in space');
      expect(newMainImage).toBeInTheDocument();
      expect(screen.queryByAltText('A cat in space')).not.toBeInTheDocument();
    });
  });

  describe('User Interaction', () => {
    it('should handle thumbnail click events', () => {
      global.Image = vi.fn().mockImplementation(() => ({
        complete: true,
        naturalWidth: 1024,
        src: '',
        crossOrigin: ''
      })) as any;

      render(<GenerationListItem {...defaultProps} />);

      // Find and click the thumbnail container
      const mainImage = screen.getByAltText('A cat in space');
      const thumbnailContainer = mainImage.closest('div[class*="cursor-pointer"]');
      
      expect(thumbnailContainer).toBeInTheDocument();
      fireEvent.click(thumbnailContainer!);

      expect(defaultProps.onImageClick).toHaveBeenCalledTimes(1);
    });

    it('should provide correct alt text for accessibility', () => {
      global.Image = vi.fn().mockImplementation(() => ({
        complete: true,
        naturalWidth: 1024,
        src: '',
        crossOrigin: ''
      })) as any;

      render(<GenerationListItem {...defaultProps} />);

      expect(screen.getByAltText('A cat in space')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle image errors without crashing', () => {
      global.Image = vi.fn().mockImplementation(() => ({
        complete: false,
        naturalWidth: 0,
        src: '',
        crossOrigin: '',
        onload: null,
        onerror: null
      })) as any;

      render(<GenerationListItem {...defaultProps} />);

      const mainImage = screen.getByAltText('A cat in space');
      
      // Simulate image error
      expect(() => fireEvent.error(mainImage)).not.toThrow();
      
      // Component should still be functional
      expect(screen.getByText('A cat in space')).toBeInTheDocument();
    });

    it('should handle component unmount gracefully', () => {
      global.Image = vi.fn().mockImplementation(() => ({
        complete: false,
        naturalWidth: 0,
        src: '',
        crossOrigin: '',
        onload: null,
        onerror: null
      })) as any;

      const { unmount } = render(<GenerationListItem {...defaultProps} />);

      // Should unmount without errors
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('State Management', () => {
    it('should reset loading state when generation changes', () => {
      global.Image = vi.fn().mockImplementation(() => ({
        complete: false,
        naturalWidth: 0,
        src: '',
        crossOrigin: '',
        onload: null,
        onerror: null
      })) as any;

      const { rerender } = render(<GenerationListItem {...defaultProps} />);

      // Change generation - should reset state
      const newGeneration = { ...mockGeneration, id: 'gen_456', prompt: 'A dog in space' };
      rerender(<GenerationListItem {...defaultProps} generation={newGeneration} />);

      // New image should start fresh
      const newMainImage = screen.getByAltText('A dog in space');
      expect(newMainImage).toHaveClass('opacity-0');
    });
  });
}); 