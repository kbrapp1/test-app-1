import { http, HttpResponse, delay } from 'msw';
import { GenerationDto, GenerationStatusDto } from '@/lib/image-generator/application/dto';

// Generate mock generation data
const generateMockGeneration = (id: number, overrides: Partial<GenerationDto> = {}): GenerationDto => ({
  id: `perf-test-${id}`,
  prompt: `Performance test generation ${id} - ${Math.random().toString(36).substring(7)}`,
  status: (Math.random() > 0.1 ? 'completed' : (Math.random() > 0.5 ? 'processing' : 'pending')) as GenerationStatusDto,
  imageUrl: `https://picsum.photos/800/600?random=${id}`,
  width: 800,
  height: 600,
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
  aspectRatio: '16:9',
  costCents: Math.floor(Math.random() * 100),
  editType: 'text-to-image',
  savedToDAM: Math.random() > 0.7,
  modelName: 'flux-dev',
  ...overrides,
});

// Performance test scenarios
export const performanceHandlers = [
  // Fast response scenario (ideal performance)
  http.get('/api/image-generator/generations/fast', async () => {
    await delay(50); // 50ms delay
    const generations = Array.from({ length: 20 }, (_, i) => generateMockGeneration(i));
    return HttpResponse.json({
      data: generations,
      hasNextPage: false,
      totalCount: 20,
    });
  }),

  // Medium load scenario (100 items)
  http.get('/api/image-generator/generations/medium', async () => {
    await delay(200); // 200ms delay
    const generations = Array.from({ length: 100 }, (_, i) => generateMockGeneration(i));
    return HttpResponse.json({
      data: generations,
      hasNextPage: true,
      totalCount: 500,
    });
  }),

  // Heavy load scenario (500+ items with pagination)
  http.get('/api/image-generator/generations/heavy', async ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    await delay(300); // 300ms delay to simulate heavy load
    
    const startIndex = (page - 1) * limit;
    const generations = Array.from({ length: limit }, (_, i) => 
      generateMockGeneration(startIndex + i)
    );
    
    return HttpResponse.json({
      data: generations,
      hasNextPage: page < 10, // 10 pages total (500 items)
      totalCount: 500,
      page,
      limit,
    });
  }),

  // Stress test scenario (1000+ items)
  http.get('/api/image-generator/generations/stress', async ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    await delay(500); // 500ms delay to simulate stress conditions
    
    const startIndex = (page - 1) * limit;
    const generations = Array.from({ length: limit }, (_, i) => 
      generateMockGeneration(startIndex + i)
    );
    
    return HttpResponse.json({
      data: generations,
      hasNextPage: page < 20, // 20 pages total (1000 items)
      totalCount: 1000,
      page,
      limit,
    });
  }),

  // Slow network scenario
  http.get('/api/image-generator/generations/slow', async () => {
    await delay(2000); // 2s delay to simulate slow network
    const generations = Array.from({ length: 50 }, (_, i) => generateMockGeneration(i));
    return HttpResponse.json({
      data: generations,
      hasNextPage: false,
      totalCount: 50,
    });
  }),

  // Intermittent failures scenario
  http.get('/api/image-generator/generations/flaky', async () => {
    if (Math.random() > 0.7) {
      return new HttpResponse(null, { status: 500 });
    }
    
    await delay(Math.random() * 1000); // Random delay 0-1s
    const generations = Array.from({ length: 30 }, (_, i) => generateMockGeneration(i));
    return HttpResponse.json({
      data: generations,
      hasNextPage: false,
      totalCount: 30,
    });
  }),

  // Memory stress test - many processing generations
  http.get('/api/image-generator/generations/memory-stress', async () => {
    await delay(100);
    const generations = Array.from({ length: 200 }, (_, i) => 
      generateMockGeneration(i, {
        status: 'processing', // All processing to test polling
        imageUrl: undefined,
      })
    );
    return HttpResponse.json({
      data: generations,
      hasNextPage: false,
      totalCount: 200,
    });
  }),

  // Cache efficiency test - same data with different cache strategies
  http.get('/api/image-generator/generations/cache-test', async ({ request }) => {
    const url = new URL(request.url);
    const cacheKey = url.searchParams.get('cacheKey') || 'default';
    
    await delay(150);
    
    // Return same data for same cache key to test cache hits
    const seed = cacheKey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const generations = Array.from({ length: 50 }, (_, i) => 
      generateMockGeneration(seed * 100 + i)
    );
    
    return HttpResponse.json({
      data: generations,
      hasNextPage: false,
      totalCount: 50,
      cacheKey,
    });
  }),

  // Individual generation polling test
  http.get('/api/image-generator/generations/:id', async ({ params }) => {
    const { id } = params;
    await delay(50);
    
    // Simulate generation progress
    const progressStates: GenerationStatusDto[] = ['pending', 'processing', 'completed'];
    const randomState = progressStates[Math.floor(Math.random() * progressStates.length)];
    
    const generation = generateMockGeneration(
      parseInt(id as string) || 1,
      {
        id: id as string,
        status: randomState,
        imageUrl: randomState === 'completed' ? `https://picsum.photos/800/600?random=${id}` : undefined,
      }
    );
    
    return HttpResponse.json(generation);
  }),

  // Batch status check endpoint
  http.post('/api/image-generator/generations/batch-status', async ({ request }) => {
    const { ids } = await request.json() as { ids: string[] };
    await delay(100);
    
    const statuses = ids.map(id => ({
      id,
      status: Math.random() > 0.3 ? 'completed' : 'processing',
      updatedAt: new Date().toISOString(),
    }));
    
    return HttpResponse.json({ statuses });
  }),

  // Image optimization endpoint
  http.get('/api/image-generator/optimize/:imageId', async ({ params }) => {
    const { imageId } = params;
    await delay(200); // Simulate optimization time
    
    return HttpResponse.json({
      originalUrl: `https://picsum.photos/800/600?random=${imageId}`,
      optimizedUrl: `https://picsum.photos/800/600?random=${imageId}&optimized=true`,
      webpUrl: `https://picsum.photos/800/600?random=${imageId}&format=webp`,
      thumbnailUrl: `https://picsum.photos/200/200?random=${imageId}`,
      sizes: {
        original: '150KB',
        optimized: '95KB',
        webp: '60KB',
        thumbnail: '15KB',
      },
    });
  }),
];

// Performance scenario configurations
export const performanceScenarios = {
  light: {
    endpoint: '/api/image-generator/generations/fast',
    expectedCount: 20,
    expectedDelay: 50,
    description: 'Fast response with minimal data'
  },
  medium: {
    endpoint: '/api/image-generator/generations/medium',
    expectedCount: 100,
    expectedDelay: 200,
    description: 'Medium load with pagination'
  },
  heavy: {
    endpoint: '/api/image-generator/generations/heavy',
    expectedCount: 500,
    expectedDelay: 300,
    description: 'Heavy load with virtual scrolling needed'
  },
  stress: {
    endpoint: '/api/image-generator/generations/stress',
    expectedCount: 1000,
    expectedDelay: 500,
    description: 'Stress test with maximum data load'
  },
  slow: {
    endpoint: '/api/image-generator/generations/slow',
    expectedCount: 50,
    expectedDelay: 2000,
    description: 'Slow network simulation'
  },
  flaky: {
    endpoint: '/api/image-generator/generations/flaky',
    expectedCount: 30,
    expectedDelay: 'variable',
    description: 'Intermittent failures and variable delays'
  },
  memoryStress: {
    endpoint: '/api/image-generator/generations/memory-stress',
    expectedCount: 200,
    expectedDelay: 100,
    description: 'Memory stress test with polling'
  },
  cacheTest: {
    endpoint: '/api/image-generator/generations/cache-test',
    expectedCount: 50,
    expectedDelay: 150,
    description: 'Cache efficiency validation'
  },
};

// Utility function to measure performance
export const measurePerformance = async (scenario: keyof typeof performanceScenarios) => {
  const config = performanceScenarios[scenario];
  const startTime = performance.now();
  
  try {
    const response = await fetch(config.endpoint);
    const data = await response.json();
    const endTime = performance.now();
    
    return {
      scenario,
      duration: endTime - startTime,
      dataCount: data.data?.length || 0,
      totalCount: data.totalCount || 0,
      hasNextPage: data.hasNextPage || false,
      success: true,
      expectedDelay: config.expectedDelay,
      actualDelay: endTime - startTime,
      efficiency: typeof config.expectedDelay === 'number' 
        ? Math.min(100, (config.expectedDelay / (endTime - startTime)) * 100)
        : null,
    };
  } catch (error) {
    const endTime = performance.now();
    
    return {
      scenario,
      duration: endTime - startTime,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}; 