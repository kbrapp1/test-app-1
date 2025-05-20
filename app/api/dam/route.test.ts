import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

// Mock getActiveOrganizationId to control auth behavior
vi.mock('@/lib/auth/server-action', () => ({
  getActiveOrganizationId: vi.fn(),
}));
import { getActiveOrganizationId } from '@/lib/auth/server-action';

// Import the handler to test
import { getHandler } from './route';

describe('DAM API Route - getHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws a ValidationError for negative limit', async () => {
    // Simulate a valid organization
    (getActiveOrganizationId as Mock).mockResolvedValue('org-123');

    const req = { url: 'http://localhost/api/dam?limit=-1' } as any;
    await expect(getHandler(req, {} as any, {} as any)).rejects.toThrow('Invalid limit parameter. Limit must be a non-negative number.');
  });

  it('throws a DatabaseError when no active organization is found', async () => {
    // Simulate missing organization
    (getActiveOrganizationId as Mock).mockResolvedValue(null);

    const req = { url: 'http://localhost/api/dam' } as any;
    await expect(getHandler(req, {} as any, {} as any)).rejects.toThrow();
  });

  // TODO: Add tests for searchTerm, global filters, and folder contents by mocking fetchSearchResults, fetchFolderContents, transformAndEnrichData, and applyQuickSearchLimits.
}); 