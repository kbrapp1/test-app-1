import { KnowledgeBaseFormService } from '../../domain/services/knowledge-processing/KnowledgeBaseFormService';
import { KnowledgeBase } from '../../domain/value-objects/ai-configuration/KnowledgeBase';
import { IChatbotConfigRepository } from '../../domain/repositories/IChatbotConfigRepository';
import { IVectorKnowledgeRepository } from '../../domain/repositories/IVectorKnowledgeRepository';
import { BusinessRuleViolationError, ResourceNotFoundError } from '../../domain/errors/ChatbotWidgetDomainErrors';
import { 
  KnowledgeBaseFormDto, 
  KnowledgeBaseProcessingResultDto,
  KnowledgeBaseUpdateRequestDto,
  KnowledgeBaseUpdateResponseDto,
  ProcessedChunkDto
} from '../dto/KnowledgeBaseFormDto';

// Helper imports following @golden-rule patterns
import {
  createChunkDto,
  calculateStatistics,
  createEmptyStatistics,
  filterValidFaqs,
  createVectorItems
} from './KnowledgeBaseFormHelpers';
import {
  validateFormData
} from './KnowledgeBaseFormValidation';

// Knowledge Base Form Application Service
//
// AI INSTRUCTIONS:
// - Application service for knowledge base form operations
// - Single responsibility: Knowledge base form workflow coordination

export class KnowledgeBaseFormApplicationService {
  constructor(
    private readonly knowledgeFormService: KnowledgeBaseFormService,
    private readonly configRepository: IChatbotConfigRepository,
    private readonly vectorRepository: IVectorKnowledgeRepository
  ) {}

  // Process and validate knowledge base form data
  async processKnowledgeBaseForm(formData: KnowledgeBaseFormDto): Promise<KnowledgeBaseProcessingResultDto> {
    const startTime = Date.now();
    
    try {
      // Validate form data using helper
      const validation = validateFormData(formData);
      if (!validation.isValid) {
        return {
          success: false,
          processedChunks: [],
          statistics: createEmptyStatistics(Date.now() - startTime),
          validation
        };
      }

      // Process content into chunks
      const processedChunks = this.processAllFormSections(formData);
      const processingTime = Date.now() - startTime;
      const statistics = calculateStatistics(processedChunks, processingTime);

      return {
        success: true,
        processedChunks,
        statistics,
        validation
      };

    } catch (error) {
      return this.createErrorResult(error, Date.now() - startTime);
    }
  }

  // Update knowledge base configuration
  async updateKnowledgeBase(request: KnowledgeBaseUpdateRequestDto): Promise<KnowledgeBaseUpdateResponseDto> {
    try {
      const existingConfig = await this.configRepository.findById(request.configId);
      if (!existingConfig) {
        throw new ResourceNotFoundError('ChatbotConfig', request.configId, { organizationId: request.organizationId });
      }

      const processingResult = await this.processKnowledgeBaseForm(request.formData);
      if (!processingResult.success) {
        return this.createFailureResponse(request.configId, processingResult);
      }

      const knowledgeBase = KnowledgeBase.create({
        companyInfo: request.formData.companyInfo || '',
        productCatalog: request.formData.productCatalog || '',
        supportDocs: request.formData.supportDocs || '',
        complianceGuidelines: request.formData.complianceGuidelines || '',
        faqs: filterValidFaqs(request.formData.faqs),
        websiteSources: existingConfig.knowledgeBase?.websiteSources || []
      });

      const updatedConfig = existingConfig.updateKnowledgeBase(knowledgeBase);
      await this.configRepository.update(updatedConfig);

      const { vectorsGenerated, affectedItems } = await this.handleVectorGeneration(request, processingResult);

      return {
        success: true,
        configId: request.configId,
        processingResult,
        vectorsGenerated,
        affectedItems,
        errors: [],
        warnings: processingResult.validation.warnings.map(w => w.message)
      };

    } catch (error) {
      if (error instanceof BusinessRuleViolationError || error instanceof ResourceNotFoundError) {
        throw error;
      }
      throw new BusinessRuleViolationError('Failed to update knowledge base configuration', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        configId: request.configId,
        organizationId: request.organizationId
      });
    }
  }

  /**
   * Process all form sections into chunks
   * AI INSTRUCTIONS: Coordinate section processing with domain service
   */
  private processAllFormSections(formData: KnowledgeBaseFormDto): ProcessedChunkDto[] {
    const processedChunks: ProcessedChunkDto[] = [];
    
    const hashFn = (content: string) => this.knowledgeFormService.generateContentHash(content);

    // Process company info
    if (formData.companyInfo?.trim()) {
      processedChunks.push(createChunkDto('company-info', 'Company Information', formData.companyInfo, ['company', 'about', 'general'], 'general', 'company_info', 0, hashFn));
    }

    // Process product catalog with intelligent chunking
    if (formData.productCatalog?.trim()) {
      const productChunks = this.knowledgeFormService.processProductCatalog(formData.productCatalog);
      processedChunks.push(createChunkDto('product-catalog-overview', 'Complete Product & Service Overview', formData.productCatalog, ['products', 'services', 'catalog', 'overview', 'complete'], 'product_info', 'product_catalog', 0, hashFn));

      productChunks.forEach((chunk, index) => {
        if (this.knowledgeFormService.validateChunkQuality(chunk)) {
          processedChunks.push(createChunkDto(`product-chunk-${index + 1}`, chunk.title, chunk.content, chunk.tags, 'product_info', 'product_catalog', chunk.chunkIndex + 1, hashFn));
        }
      });
    }

    // Process support docs
    if (formData.supportDocs?.trim()) {
      processedChunks.push(createChunkDto('support-docs', 'Support Documentation', formData.supportDocs, ['support', 'help', 'documentation'], 'support', 'support_docs', 0, hashFn));
    }

    // Process compliance guidelines
    if (formData.complianceGuidelines?.trim()) {
      processedChunks.push(createChunkDto('compliance-guidelines', 'Compliance Guidelines', formData.complianceGuidelines, ['compliance', 'legal', 'guidelines'], 'general', 'support_docs', 0, hashFn));
    }

    // Process FAQs
    formData.faqs.filter(faq => faq.question?.trim() && faq.answer?.trim()).forEach(faq => {
      processedChunks.push(createChunkDto(faq.id, faq.question, faq.answer, faq.keywords.length > 0 ? faq.keywords : [faq.category || 'general'], 'support', 'faq', 0, hashFn));
    });

    return processedChunks;
  }

  /**
   * Create failure response for update operations
   * AI INSTRUCTIONS: Standard failure response creation
   */
  private createFailureResponse(configId: string, processingResult: KnowledgeBaseProcessingResultDto): KnowledgeBaseUpdateResponseDto {
    return {
      success: false,
      configId,
      processingResult,
      vectorsGenerated: false,
      affectedItems: 0,
      errors: processingResult.validation.errors.map(e => e.message),
      warnings: processingResult.validation.warnings.map(w => w.message)
    };
  }

  /**
   * Handle vector generation if requested
   * AI INSTRUCTIONS: Vector generation coordination
   */
  private async handleVectorGeneration(request: KnowledgeBaseUpdateRequestDto, processingResult: KnowledgeBaseProcessingResultDto): Promise<{ vectorsGenerated: boolean; affectedItems: number }> {
    if (!request.generateVectors || processingResult.processedChunks.length === 0) {
      return { vectorsGenerated: false, affectedItems: 0 };
    }

    try {
      const vectorItems = createVectorItems(processingResult.processedChunks);
      
      // Actually store the vector items in the database
      const storeKnowledgeItems = (await import('../../presentation/actions/updateKnowledgeBaseActions')).storeKnowledgeItems;
      const storeResult = await storeKnowledgeItems(
        request.organizationId,
        request.configId,
        vectorItems.map(item => ({
          knowledgeItemId: item.knowledgeItemId,
          title: item.title,
          content: item.content,
          category: item.category,
          sourceType: item.sourceType as 'faq' | 'company_info' | 'product_catalog' | 'support_docs' | 'website_crawled',
          sourceUrl: item.sourceUrl,
          contentHash: item.contentHash
        }))
      );

      if (!storeResult.success) {
        throw new Error(storeResult.error || 'Failed to store vectors');
      }

      return { vectorsGenerated: true, affectedItems: vectorItems.length };
    } catch {
      return { vectorsGenerated: false, affectedItems: 0 };
    }
  }

  /**
   * Create error result for processing failures
   * AI INSTRUCTIONS: Standard error response creation
   */
  private createErrorResult(error: unknown, processingTime: number): KnowledgeBaseProcessingResultDto {
    return {
      success: false,
      processedChunks: [],
      statistics: createEmptyStatistics(processingTime),
      validation: {
        isValid: false,
        errors: [{
          field: 'processing',
          message: error instanceof Error ? error.message : 'Unknown processing error',
          code: 'PROCESSING_FAILED',
          severity: 'high'
        }],
        warnings: [],
        suggestions: []
      }
    };
  }
}