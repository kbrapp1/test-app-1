import { vi } from 'vitest';

// Create the mock function that will be used by tests
const revalidatePath = vi.fn();

// Export it so tests can import and control it via the mocked module
export { revalidatePath };

// Export other potential exports from next/cache as undefined or mocks if needed
// export const revalidateTag = vi.fn();
// export const unstable_cache = vi.fn(); 