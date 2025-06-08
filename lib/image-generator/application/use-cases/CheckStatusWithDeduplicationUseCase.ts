import { StatusCheckingRepository } from '../../domain/repositories/StatusCheckingRepository';
import { ExternalProviderStatusService } from '../../infrastructure/providers/ExternalProviderStatusService';
import { StatusMapper } from '../mappers/StatusMapper';
import {
  StatusCheckRequestDto,
  BatchStatusResponseDto,
  DeduplicationKeyDto
} from '../dto/StatusDto';

/**
 * Use Case: Check status with intelligent deduplication and caching
 * Application Layer - Single Responsibility for status checking
 */
export class CheckStatusWithDeduplicationUseCase {
  private requestCache = new Map<string, { response: BatchStatusResponseDto; timestamp: number; ttl: number }>();
  private pendingRequests = new Map<string, Promise<BatchStatusResponseDto>>();
  private readonly CACHE_TTL_MS = 2000;
  private readonly DEDUPLICATION_WINDOW_MS = 500;

  constructor(
    private readonly statusRepository: StatusCheckingRepository,
    private readonly providerStatusService: ExternalProviderStatusService
  ) {}

  async execute(request: StatusCheckRequestDto): Promise<BatchStatusResponseDto> {
    const start = Date.now();
    const keyDto: DeduplicationKeyDto = StatusMapper.toDeduplicationKeyDto(
      request.generationIds,
      request.userId,
      request.organizationId
    );
    const hash = keyDto.hash;

    // Cached response
    const cached = this.requestCache.get(hash);
    if (cached && Date.now() - cached.timestamp <= cached.ttl) {
      return { ...cached.response, metadata: { ...cached.response.metadata, processingTimeMs: Date.now() - start, wasFromCache: true } };
    }

    // Pending request
    let promise = this.pendingRequests.get(hash);
    if (!promise) {
      promise = this.statusRepository.findGenerationsForBatchStatusCheck(
        request.generationIds,
        request.userId,
        request.organizationId
      ).then(res => {
        // Map repository result to batch response DTO
        if (!res.isSuccess()) {
          // Map each requested generation to an error
          const errors = request.generationIds.map(id => ({ generationId: id, error: res.getError() }));
          return StatusMapper.toBatchResponseDto([], request.requestId, start, errors);
        }
        const generations = res.getValue();
        return StatusMapper.toBatchResponseDto(generations, request.requestId, start, []);
      });
      this.pendingRequests.set(hash, promise);
    }

    try {
      const response = await promise;
      if (response.success) {
        this.requestCache.set(hash, { response, timestamp: Date.now(), ttl: this.CACHE_TTL_MS });
      }
      return response;
    } finally {
      this.pendingRequests.delete(hash);
    }
  }
} 