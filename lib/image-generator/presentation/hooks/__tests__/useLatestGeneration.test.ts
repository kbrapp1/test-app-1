import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useLatestGeneration } from '../useLatestGeneration';
import { GenerationDto } from '../../../application/dto';

// Mock the useGenerationPolling hook
vi.mock('../specialized/useGenerationPolling', () => ({
  useGenerationPolling: vi.fn(() => ({ data: null })),
}));

describe('useLatestGeneration', () => {
  const mockGenerations: GenerationDto[] = [
    {
      id: '1',
      prompt: 'Test prompt',
      status: 'completed',
      imageUrl: 'https://example.com/image1.jpg',
      width: 1024,
      height: 1024,
      costCents: 100,
      savedToDAM: false,
      editType: 'text-to-image',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:01:00Z',
    },
    {
      id: '2',
      prompt: 'Older prompt',
      status: 'completed',
      imageUrl: 'https://example.com/image2.jpg',
      width: 1024,
      height: 1024,
      costCents: 100,
      savedToDAM: false,
      editType: 'text-to-image',
      createdAt: '2023-12-31T00:00:00Z',
      updatedAt: '2023-12-31T00:01:00Z',
    },
  ];

  it('should return the latest generation', () => {
    const { result } = renderHook(() =>
      useLatestGeneration({
        generations: mockGenerations,
      })
    );

    expect(result.current.latestGeneration).toEqual(mockGenerations[0]);
    expect(result.current.isLatestGenerating).toBe(false);
  });

  it('should identify generating status correctly', () => {
    const generatingGenerations: GenerationDto[] = [
      {
        ...mockGenerations[0],
        status: 'processing',
        imageUrl: undefined,
      },
    ];

    const { result } = renderHook(() =>
      useLatestGeneration({
        generations: generatingGenerations,
      })
    );

    expect(result.current.isLatestGenerating).toBe(true);
  });

  it('should call onImageComplete when generation completes', () => {
    const onImageComplete = vi.fn();
    
    const processingGeneration: GenerationDto = {
      ...mockGenerations[0],
      status: 'processing',
      imageUrl: undefined,
    };

    const { rerender } = renderHook(
      ({ generations }) =>
        useLatestGeneration({
          generations,
          onImageComplete,
        }),
      {
        initialProps: {
          generations: [processingGeneration],
        },
      }
    );

    // Update to completed status
    rerender({
      generations: [mockGenerations[0]], // Completed with imageUrl
    });

    expect(onImageComplete).toHaveBeenCalledWith(mockGenerations[0].imageUrl);
  });

  it('should handle empty generations array', () => {
    const { result } = renderHook(() =>
      useLatestGeneration({
        generations: [],
      })
    );

    expect(result.current.latestGeneration).toBe(null);
    expect(result.current.isLatestGenerating).toBe(false);
  });
}); 