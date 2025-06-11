/**
 * Update Knowledge Base Command
 * 
 * CQRS Command for updating chatbot knowledge base.
 * Represents a write operation request for knowledge base modifications.
 * 
 * Single Responsibility: Encapsulate knowledge base update request data
 */

import { KnowledgeBase } from '../../domain/entities/ChatbotConfig';

export interface UpdateKnowledgeBaseCommand {
  configId: string;
  knowledgeBase: KnowledgeBase;
}

export interface UpdateKnowledgeBaseResult {
  configId: string;
  success: boolean;
  knowledgeBaseScore: number;
  recommendations: string[];
  warnings: string[];
} 