import { vi } from 'vitest';
import type { User } from '@supabase/supabase-js';

export const checkAuth = vi.fn().mockImplementation(() => Promise.resolve({
  authenticated: true,
  user: {
    id: 'mock-user-id',
    app_metadata: { role: 'admin' }
  } as Partial<User>
})); 