import { prependGenerationToPages, InfiniteData } from './prependGenerationToPages';
import { GenerationDto } from '../../../../application/dto';

describe('prependGenerationToPages', () => {
  const makeGen = (id: string): GenerationDto => ({
    id,
    prompt: `prompt-${id}`,
    providerName: 'replicate',
    modelName: 'flux-kontext-max',
    status: 'completed',
    imageUrl: `url-${id}`,
    createdAt: new Date().toISOString(),
    costCents: 0,
    savedToDAM: false,
    updatedAt: new Date().toISOString(),
    createdByUserId: 'user',
    organizationId: 'org',
  } as unknown as GenerationDto);

  it('should create a new page if no oldData', () => {
    const newGen = makeGen('new');
    const result = prependGenerationToPages(undefined, newGen, 3);
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0]).toEqual([newGen]);
    expect(result.pageParams).toEqual([0]);
  });

  it('should prepend to existing first page and trim to pageSize', () => {
    const PAGE_SIZE = 3;
    // old page has exactly PAGE_SIZE items
    const oldGens = [makeGen('1'), makeGen('2'), makeGen('3')];
    const oldData: InfiniteData = { pages: [oldGens], pageParams: [0] };
    const newGen = makeGen('new');

    const result = prependGenerationToPages(oldData, newGen, PAGE_SIZE);

    // First page length should remain PAGE_SIZE
    expect(result.pages[0]).toHaveLength(PAGE_SIZE);
    // New gen is first item
    expect(result.pages[0][0]).toBe(newGen);
    // Old items shifted, last original dropped
    expect(result.pages[0].slice(1)).toEqual([oldGens[0], oldGens[1]]);
  });

  it('should handle smaller existing pages', () => {
    const PAGE_SIZE = 5;
    const oldGens = [makeGen('1'), makeGen('2')];
    const oldData: InfiniteData = { pages: [oldGens], pageParams: [0] };
    const newGen = makeGen('new');

    const result = prependGenerationToPages(oldData, newGen, PAGE_SIZE);

    // First page length should be old length + 1
    expect(result.pages[0]).toHaveLength(oldGens.length + 1);
    expect(result.pages[0][0]).toBe(newGen);
    expect(result.pages[0].slice(1)).toEqual(oldGens);
  });

  it('should preserve additional pages', () => {
    const PAGE_SIZE = 2;
    const page1 = [makeGen('1'), makeGen('2')];
    const page2 = [makeGen('3')];
    const oldData: InfiniteData = { pages: [page1, page2], pageParams: [0, 1] };
    const newGen = makeGen('new');

    const result = prependGenerationToPages(oldData, newGen, PAGE_SIZE);
    // First page trim to PAGE_SIZE
    expect(result.pages[0]).toHaveLength(PAGE_SIZE);
    // Second page unchanged
    expect(result.pages[1]).toEqual(page2);
    // pageParams unchanged
    expect(result.pageParams).toEqual(oldData.pageParams);
  });
}); 