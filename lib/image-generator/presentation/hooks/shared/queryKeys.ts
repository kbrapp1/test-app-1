// Query Keys for Image Generation
export const IMAGE_GENERATION_QUERY_KEYS = {
  all: ['image-generations'] as const,
  lists: () => [...IMAGE_GENERATION_QUERY_KEYS.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...IMAGE_GENERATION_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...IMAGE_GENERATION_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...IMAGE_GENERATION_QUERY_KEYS.details(), id] as const,
  stats: () => [...IMAGE_GENERATION_QUERY_KEYS.all, 'stats'] as const,
} as const;

// Memoized query key generators
export const createListQueryKey = (filters: Record<string, unknown>) => 
  IMAGE_GENERATION_QUERY_KEYS.list(filters);

export const createDetailQueryKey = (id: string) => 
  IMAGE_GENERATION_QUERY_KEYS.detail(id);

export const createStatsQueryKey = () => 
  IMAGE_GENERATION_QUERY_KEYS.stats(); 