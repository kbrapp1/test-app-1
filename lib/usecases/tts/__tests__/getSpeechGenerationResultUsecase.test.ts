import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSpeechGenerationResult } from '../getSpeechGenerationResultUsecase';

// Mock Supabase server client
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockUpdate = vi.fn();
const mockEqUpdate = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    from: mockFrom,
    auth: { getUser: vi.fn() }, // not used here
  }),
}));

// Mock Replicate service
const mockGetReplicatePrediction = vi.fn();
vi.mock('@/lib/services/ttsService', () => ({
  getReplicatePrediction: (...args: unknown[]) => mockGetReplicatePrediction(...args),
}));

// Setup chainable mocks
beforeEach(() => {
  vi.clearAllMocks();
  mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });
  mockSelect.mockReturnValue({ eq: mockEq, // for select
    single: mockSingle });
  mockEq.mockReturnValue({ single: mockSingle });
  mockUpdate.mockReturnValue({ eq: mockEqUpdate });
  mockEqUpdate.mockResolvedValue({ error: null });
});

describe('getSpeechGenerationResultUsecase', () => {
  it('returns error when DB fetch fails', async () => {
    // Simulate DB fetch error
    mockSingle.mockResolvedValue({ data: null, error: { message: 'fetch error' } });

    const result = await getSpeechGenerationResult('db-id');

    expect(result.success).toBe(false);
    expect(result.status).toBe('failed');
    expect(result.error).toContain('Failed to fetch prediction details from database');
  });

  it('returns error when provider or predictionId missing', async () => {
    // Simulate DB fetch with missing fields
    mockSingle.mockResolvedValue({ data: { prediction_provider: '', replicatePredictionId: '' }, error: null });

    const result = await getSpeechGenerationResult('db-id');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database record is missing provider information.');
  });

  it('updates DB and returns processing status when replicate status is processing', async () => {
    // DB fetch returns a valid record
    const record = { id: 'db-id', prediction_provider: 'replicate', replicatePredictionId: 'rep1' };
    mockSingle.mockResolvedValue({ data: record, error: null });
    // Replicate returns processing
    mockGetReplicatePrediction.mockResolvedValue({ status: 'processing', output: null, error: null });

    const result = await getSpeechGenerationResult('db-id');

    expect(mockUpdate).toHaveBeenCalledWith({ status: 'processing', updatedAt: expect.any(String) });
    expect(result.success).toBe(false);
    expect(result.status).toBe('processing');
    expect(result.error).toBeNull();
  });

  it('updates DB and returns succeeded when replicate status is succeeded', async () => {
    // DB fetch returns a valid record
    const record = { id: 'db-id', prediction_provider: 'replicate', replicatePredictionId: 'rep2' };
    mockSingle.mockResolvedValue({ data: record, error: null });
    // Replicate returns succeeded with output
    mockGetReplicatePrediction.mockResolvedValue({ status: 'succeeded', output: 'url', error: null });

    const result = await getSpeechGenerationResult('db-id');

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'succeeded', outputUrl: 'url', updatedAt: expect.any(String) })
    );
    expect(result.success).toBe(true);
    expect(result.status).toBe('succeeded');
    expect(result.audioUrl).toBe('url');
    expect(result.error).toBeNull();
  });

  it('returns error when replicate status succeeded but no output', async () => {
    const record = { id: 'db-id', prediction_provider: 'replicate', replicatePredictionId: 'rep3' };
    mockSingle.mockResolvedValue({ data: record, error: null });
    mockGetReplicatePrediction.mockResolvedValue({ status: 'succeeded', output: null, error: null });

    const result = await getSpeechGenerationResult('db-id');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Prediction succeeded but audio URL is missing.');
  });

  it('handles replicate error with final failed status', async () => {
    const record = { id: 'db-id', prediction_provider: 'replicate', replicatePredictionId: 'rep4' };
    mockSingle.mockResolvedValue({ data: record, error: null });
    mockGetReplicatePrediction.mockResolvedValue({ status: 'failed', output: null, error: 'replicate error' });

    const result = await getSpeechGenerationResult('db-id');

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed', errorMessage: 'replicate error', updatedAt: expect.any(String) })
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('replicate error');
  });

  it('returns error when DB update fails', async () => {
    const record = { id: 'db-id', prediction_provider: 'replicate', replicatePredictionId: 'rep5' };
    mockSingle.mockResolvedValue({ data: record, error: null });
    mockGetReplicatePrediction.mockResolvedValue({ status: 'succeeded', output: 'url5', error: null });
    // Simulate DB update error
    mockEqUpdate.mockResolvedValue({ error: { message: 'update failed' } });

    const result = await getSpeechGenerationResult('db-id');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to update prediction in database: update failed');
  });
}); 