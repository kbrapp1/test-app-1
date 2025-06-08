import { QueryObserverResult } from '@tanstack/react-query';
import { GenerationDto } from '../../../../application/dto';

export interface InfiniteData {
  pages: GenerationDto[][];
  pageParams: any[];
}

/**
 * Prepend a new generation to the first page of infinite query data,
 * keeping the first page at most pageSize items.
 * If oldData is empty, returns a single-page dataset.
 */
export function prependGenerationToPages(
  oldData: InfiniteData | undefined,
  newGen: GenerationDto,
  pageSize: number
): InfiniteData {
  if (!oldData || !oldData.pages) {
    return {
      pages: [[newGen]],
      pageParams: [0]
    };
  }

  const newPages = [...oldData.pages];
  const firstPage = newPages[0] || [];
  // Prepend and trim
  const updatedFirstPage = [newGen, ...firstPage.slice(0, pageSize - 1)];
  newPages[0] = updatedFirstPage;

  return {
    ...oldData,
    pages: newPages
  };
} 