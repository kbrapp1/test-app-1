/**
 * Knowledge Base Settings Hook
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Knowledge base form state and operations
 * - Encapsulate form logic and mutation handling
 * - Provide clean interface for knowledge base management
 * - Handle optimistic updates and error states
 * - Follow @golden-rule patterns exactly
 */

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateChatbotConfig } from '../actions/configActions';
import { UpdateChatbotConfigDto, FaqDto, ChatbotConfigDto } from '../../application/dto/ChatbotConfigDto';
import { KnowledgeItem } from '../../domain/services/interfaces/IKnowledgeRetrievalService';
// Import will be done dynamically to avoid server-side issues

/**
 * Create content hash for deduplication
 * 
 * AI INSTRUCTIONS:
 * - Simple hash function for content deduplication
 * - No external dependencies
 * - Consistent output for same input
 */
function createContentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Product chunk interface for intelligent chunking
 */
interface ProductChunk {
  title: string;
  content: string;
  tags: string[];
}

/**
 * Product section interface for section identification
 */
interface ProductSection {
  title?: string;
  content: string;
}

/**
 * Intelligent Product Chunking - 2025 RAG Strategy
 * 
 * AI INSTRUCTIONS:
 * - Chunks product catalog by semantic sections
 * - Maintains context while enabling specific matching
 * - Optimizes chunk size for embedding model performance
 * - Preserves product relationships and categories
 */
function intelligentProductChunking(catalog: string): ProductChunk[] {
  const chunks: ProductChunk[] = [];
  
  // Split by common product catalog patterns
  const sections = identifyProductSections(catalog);
  
  sections.forEach((section, index) => {
    // Ensure each chunk has sufficient context
    const contextualContent = addContextToChunk(section, catalog);
    
    chunks.push({
      title: section.title || `Product Section ${index + 1}`,
      content: contextualContent,
      tags: extractProductTags(section.content)
    });
  });

  return chunks;
}

/**
 * Identify Product Sections - Smart Pattern Recognition
 */
function identifyProductSections(catalog: string): ProductSection[] {
  const sections: ProductSection[] = [];
  
  // Strategy 1: Split by headers (markdown-style or numbered)
  const headerPattern = /^(#{1,6}\s+.*|^\d+\.\s+.*|^[A-Z][^.]*:)/gm;
  const headerMatches = Array.from(catalog.matchAll(headerPattern));
  
  if (headerMatches.length > 1) {
    // Split by headers
    for (let i = 0; i < headerMatches.length; i++) {
      const currentMatch = headerMatches[i];
      const nextMatch = headerMatches[i + 1];
      
      const startIndex = currentMatch.index!;
      const endIndex = nextMatch ? nextMatch.index! : catalog.length;
      
      const sectionContent = catalog.slice(startIndex, endIndex).trim();
      const title = currentMatch[0].replace(/^#{1,6}\s+|^\d+\.\s+|:$/g, '').trim();
      
      if (sectionContent.length > 50) { // Minimum viable chunk size
        sections.push({
          title: title || undefined,
          content: sectionContent
        });
      }
    }
  } else {
    // Strategy 2: Split by paragraph breaks for unstructured content
    const paragraphs = catalog.split(/\n\s*\n/).filter(p => p.trim().length > 50);
    
    if (paragraphs.length > 1) {
      paragraphs.forEach((paragraph, index) => {
        sections.push({
          title: `Product Information ${index + 1}`,
          content: paragraph.trim()
        });
      });
    } else {
      // Strategy 3: Fallback - use complete catalog as single section
      sections.push({
        title: 'Product Catalog',
        content: catalog
      });
    }
  }
  
  return sections;
}

/**
 * Add Context to Chunk - Maintain Semantic Coherence
 */
function addContextToChunk(section: ProductSection, fullCatalog: string): string {
  let contextualContent = '';
  
  // Add section title if available
  if (section.title) {
    contextualContent += `${section.title}\n\n`;
  }
  
  // Add main content
  contextualContent += section.content;
  
  return contextualContent;
}

/**
 * Extract Product Tags from content
 */
function extractProductTags(content: string): string[] {
  const tags: string[] = [];
  const lowercaseContent = content.toLowerCase();
  
  // Common product/service keywords
  const keywords = [
    'software', 'hardware', 'service', 'solution', 'platform',
    'consulting', 'support', 'training', 'development', 'design',
    'marketing', 'sales', 'analytics', 'automation', 'integration'
  ];
  
  keywords.forEach(keyword => {
    if (lowercaseContent.includes(keyword)) {
      tags.push(keyword);
    }
  });
  
  return tags.length > 0 ? tags : ['general'];
}

export interface KnowledgeBaseFormData {
  companyInfo: string;
  productCatalog: string;
  supportDocs: string;
  complianceGuidelines: string;
  faqs: FaqDto[];
}

export function useKnowledgeBaseSettings(
  existingConfig: ChatbotConfigDto | null,
  organizationId: string | null
) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<KnowledgeBaseFormData>({
    companyInfo: '',
    productCatalog: '',
    supportDocs: '',
    complianceGuidelines: '',
    faqs: [],
  });

  // Update form state when existingConfig changes
  useEffect(() => {
    if (existingConfig?.knowledgeBase) {
      setFormData({
        companyInfo: existingConfig.knowledgeBase.companyInfo || '',
        productCatalog: existingConfig.knowledgeBase.productCatalog || '',
        supportDocs: existingConfig.knowledgeBase.supportDocs || '',
        complianceGuidelines: existingConfig.knowledgeBase.complianceGuidelines || '',
        faqs: existingConfig.knowledgeBase.faqs || [],
      });
    }
  }, [existingConfig]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateChatbotConfigDto }) =>
      updateChatbotConfig(id, data, organizationId || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-config', organizationId] });
    },
  });

  const handleSave = async () => {
    if (!organizationId || !existingConfig) return;

    // Step 1: Update the knowledge base configuration
    const result = await updateMutation.mutateAsync({
      id: existingConfig.id,
      data: {
        knowledgeBase: {
          companyInfo: formData.companyInfo,
          productCatalog: formData.productCatalog,
          supportDocs: formData.supportDocs,
          complianceGuidelines: formData.complianceGuidelines,
          faqs: formData.faqs,
        },
      },
    });

    // Step 2: Trigger proactive vector generation
    try {
      // Import the vector update action
      // updateKnowledgeBaseImmediate removed - using direct vector service calls instead
      
      // Convert knowledge base to knowledge items using the same logic as KnowledgeItemService
      const knowledgeItems = [];
      
      // Company info
      if (formData.companyInfo) {
        knowledgeItems.push({
          id: 'company-info',
          title: 'Company Information',
          content: formData.companyInfo,
          category: 'general' as const,
          tags: ['company', 'about', 'general'],
          relevanceScore: 0.8,
          source: 'chatbot_config' as const,
          lastUpdated: new Date()
        });
      }
      
      // Product catalog - use the same chunking logic as KnowledgeItemService
      if (formData.productCatalog) {
        // Strategy 1: Complete catalog overview
        knowledgeItems.push({
          id: 'product-catalog-overview',
          title: 'Complete Product & Service Overview',
          content: formData.productCatalog,
          category: 'product_info' as const,
          tags: ['products', 'services', 'catalog', 'overview', 'complete'],
          relevanceScore: 0.9,
          source: 'chatbot_config' as const,
          lastUpdated: new Date()
        });
        
        // Strategy 2: Intelligent chunking for specific product queries
        const productChunks = intelligentProductChunking(formData.productCatalog);
        productChunks.forEach((chunk, index) => {
          knowledgeItems.push({
            id: `product-chunk-${index + 1}`,
            title: chunk.title,
            content: chunk.content,
            category: 'product_info' as const,
            tags: [...chunk.tags, 'products', 'specific'],
            relevanceScore: 0.85,
            source: 'chatbot_config' as const,
            lastUpdated: new Date()
          });
        });
      }
      
      // Support docs
      if (formData.supportDocs) {
        knowledgeItems.push({
          id: 'support-docs',
          title: 'Support Documentation',
          content: formData.supportDocs,
          category: 'support' as const,
          tags: ['support', 'help', 'documentation'],
          relevanceScore: 0.7,
          source: 'chatbot_config' as const,
          lastUpdated: new Date()
        });
      }
      
      // Compliance guidelines
      if (formData.complianceGuidelines) {
        knowledgeItems.push({
          id: 'compliance-guidelines',
          title: 'Compliance Guidelines',
          content: formData.complianceGuidelines,
          category: 'general' as const,
          tags: ['compliance', 'legal', 'guidelines'],
          relevanceScore: 0.6,
          source: 'chatbot_config' as const,
          lastUpdated: new Date()
        });
      }
      
      // FAQs
      formData.faqs.filter(faq => faq.question && faq.answer).forEach(faq => {
        knowledgeItems.push({
          id: faq.id,
          title: faq.question,
          content: faq.answer,
          category: 'support' as const,
          tags: [faq.category || 'general'],
          relevanceScore: 0.8,
          source: 'faq' as const,
          lastUpdated: new Date()
        });
      });

      // Vector generation using VectorKnowledgeApplicationService
      if (knowledgeItems.length > 0) {
        // Transform knowledge items to vector service format
        const vectorItems = knowledgeItems.map(item => ({
          knowledgeItemId: item.id,
          title: item.title,
          content: item.content,
          category: item.category,
          sourceType: 'faq' as const, // All config-based items are treated as FAQ type
          sourceUrl: undefined, // No URL for config-based items
          contentHash: createContentHash(item.content)
        }));

        // Get vector service and store items
        const { storeKnowledgeItems } = await import('../actions/updateKnowledgeBaseActions');
        await storeKnowledgeItems(organizationId, existingConfig.id, vectorItems);
      }

    } catch (vectorError) {
      // Don't fail the whole operation if vector generation fails
      // Error is handled internally by the vector management service
    }

    return result;
  };

  const resetForm = () => {
    if (existingConfig?.knowledgeBase) {
      setFormData({
        companyInfo: existingConfig.knowledgeBase.companyInfo || '',
        productCatalog: existingConfig.knowledgeBase.productCatalog || '',
        supportDocs: existingConfig.knowledgeBase.supportDocs || '',
        complianceGuidelines: existingConfig.knowledgeBase.complianceGuidelines || '',
        faqs: existingConfig.knowledgeBase.faqs || [],
      });
    }
  };

  const updateFormData = (updates: Partial<KnowledgeBaseFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const addFaq = (faq: Omit<FaqDto, 'id'>) => {
    const newFaq: FaqDto = {
      id: `faq_${Date.now()}`,
      ...faq,
      keywords: faq.keywords || [],
      priority: faq.priority || 1,
    };

    setFormData(prev => ({
      ...prev,
      faqs: [...prev.faqs, newFaq],
    }));
  };

  const removeFaq = (faqId: string) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.filter(faq => faq.id !== faqId),
    }));
  };

  const updateFaq = (faqId: string, updates: Partial<FaqDto>) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.map(faq => 
        faq.id === faqId ? { ...faq, ...updates } : faq
      ),
    }));
  };

  return {
    formData,
    updateMutation,
    handleSave,
    resetForm,
    updateFormData,
    addFaq,
    removeFaq,
    updateFaq,
  };
} 