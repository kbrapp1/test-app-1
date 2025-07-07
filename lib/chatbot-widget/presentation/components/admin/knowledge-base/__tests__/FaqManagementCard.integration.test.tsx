/**
 * FaqManagementCard Integration Tests
 * 
 * These tests verify the pending FAQ detection mechanism that automatically
 * adds filled FAQ forms when the user clicks "Save Changes" without clicking "Add FAQ".
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FaqManagementCard, FaqManagementCardRef } from '../FaqManagementCard';
// Mock data
interface KnowledgeBaseFormData {
  companyInfo: string;
  productCatalog: string;
  supportDocs: string;
  complianceGuidelines: string;
  faqs: Array<{
    id: string;
    question: string;
    answer: string;
    category: string;
    keywords: string[];
    priority: number;
  }>;
}

// Mock data
const mockFormData: KnowledgeBaseFormData = {
  companyInfo: 'Test Company',
  productCatalog: '',
  supportDocs: '',
  complianceGuidelines: '',
  faqs: [
    {
      id: 'faq-1',
      question: 'Existing FAQ',
      answer: 'Existing answer',
      category: 'general',
      keywords: [],
      priority: 1,
    },
  ],
};

describe('FaqManagementCard - Pending FAQ Detection', () => {
  let mockOnAddFaq: ReturnType<typeof vi.fn>;
  let mockOnRemoveFaq: ReturnType<typeof vi.fn>;
  let cardRef: React.RefObject<FaqManagementCardRef | null>;

  beforeEach(() => {
    mockOnAddFaq = vi.fn();
    mockOnRemoveFaq = vi.fn();
    cardRef = React.createRef<FaqManagementCardRef>();
  });

  it('should detect and add pending FAQ when form is filled', async () => {
    render(
      <FaqManagementCard
        ref={cardRef}
        formData={mockFormData}
        isEditing={true}
        onAddFaq={mockOnAddFaq}
        onRemoveFaq={mockOnRemoveFaq}
      />
    );

    // Fill out the FAQ form
    const questionInput = screen.getByLabelText(/question/i);
    const answerInput = screen.getByLabelText(/answer/i);

    fireEvent.change(questionInput, {
      target: { value: 'What are your business hours?' },
    });
    fireEvent.change(answerInput, {
      target: { value: 'We are open Monday-Friday 9am-5pm' },
    });

    // Call addPendingFaq (this simulates what happens when Save Changes is clicked)
    let wasAdded: boolean | undefined;
    act(() => {
      wasAdded = cardRef.current?.addPendingFaq();
    });

    // Verify that the pending FAQ was detected and added
    expect(wasAdded).toBe(true);
    expect(mockOnAddFaq).toHaveBeenCalledWith({
      question: 'What are your business hours?',
      answer: 'We are open Monday-Friday 9am-5pm',
      category: 'general',
      keywords: [],
      priority: 1,
    });

    // Verify form is cleared after adding - wait for state update
    await waitFor(() => {
      expect(questionInput).toHaveValue('');
      expect(answerInput).toHaveValue('');
    });
  });

  it('should return false when no pending FAQ exists', () => {
    render(
      <FaqManagementCard
        ref={cardRef}
        formData={mockFormData}
        isEditing={true}
        onAddFaq={mockOnAddFaq}
        onRemoveFaq={mockOnRemoveFaq}
      />
    );

    // Don't fill the form, just call addPendingFaq
    const wasAdded = cardRef.current?.addPendingFaq();

    // Should return false since no pending FAQ exists
    expect(wasAdded).toBe(false);
    expect(mockOnAddFaq).not.toHaveBeenCalled();
  });

  test('should not add FAQ with only question filled', () => {
    render(
      <FaqManagementCard
        ref={cardRef}
        formData={mockFormData}
        isEditing={true}
        onAddFaq={mockOnAddFaq}
        onRemoveFaq={mockOnRemoveFaq}
      />
    );

    // Fill only the question
    const questionInput = screen.getByLabelText(/question/i);
    fireEvent.change(questionInput, {
      target: { value: 'Incomplete FAQ' },
    });

    // Call addPendingFaq
    const wasAdded = cardRef.current?.addPendingFaq();

    // Should not add incomplete FAQ
    expect(wasAdded).toBe(false);
    expect(mockOnAddFaq).not.toHaveBeenCalled();
  });

  test('should not add FAQ with only answer filled', () => {
    render(
      <FaqManagementCard
        ref={cardRef}
        formData={mockFormData}
        isEditing={true}
        onAddFaq={mockOnAddFaq}
        onRemoveFaq={mockOnRemoveFaq}
      />
    );

    // Fill only the answer
    const answerInput = screen.getByLabelText(/answer/i);
    fireEvent.change(answerInput, {
      target: { value: 'Answer without question' },
    });

    // Call addPendingFaq
    const wasAdded = cardRef.current?.addPendingFaq();

    // Should not add incomplete FAQ
    expect(wasAdded).toBe(false);
    expect(mockOnAddFaq).not.toHaveBeenCalled();
  });

  test('should handle whitespace-only inputs correctly', () => {
    render(
      <FaqManagementCard
        ref={cardRef}
        formData={mockFormData}
        isEditing={true}
        onAddFaq={mockOnAddFaq}
        onRemoveFaq={mockOnRemoveFaq}
      />
    );

    // Fill with whitespace-only content
    const questionInput = screen.getByLabelText(/question/i);
    const answerInput = screen.getByLabelText(/answer/i);

    fireEvent.change(questionInput, { target: { value: '   ' } });
    fireEvent.change(answerInput, { target: { value: '\t\n  ' } });

    // Call addPendingFaq
    const wasAdded = cardRef.current?.addPendingFaq();

    // Should not add FAQ with whitespace-only content
    expect(wasAdded).toBe(false);
    expect(mockOnAddFaq).not.toHaveBeenCalled();
  });

  test('should preserve selected category when adding pending FAQ', () => {
    render(
      <FaqManagementCard
        ref={cardRef}
        formData={mockFormData}
        isEditing={true}
        onAddFaq={mockOnAddFaq}
        onRemoveFaq={mockOnRemoveFaq}
      />
    );

    // Fill form with custom category
    const questionInput = screen.getByLabelText(/question/i);
    const answerInput = screen.getByLabelText(/answer/i);
    const categorySelect = screen.getByLabelText(/category/i);

    fireEvent.change(questionInput, {
      target: { value: 'Support question' },
    });
    fireEvent.change(answerInput, {
      target: { value: 'Support answer' },
    });
    fireEvent.change(categorySelect, {
      target: { value: 'support' },
    });

    // Call addPendingFaq
    let wasAdded: boolean | undefined;
    act(() => {
      wasAdded = cardRef.current?.addPendingFaq();
    });

    // Verify category is preserved
    expect(wasAdded).toBe(true);
    expect(mockOnAddFaq).toHaveBeenCalledWith({
      question: 'Support question',
      answer: 'Support answer',
      category: 'support',
      keywords: [],
      priority: 1,
    });
  });

  test('should work correctly with traditional Add FAQ button', async () => {
    render(
      <FaqManagementCard
        ref={cardRef}
        formData={mockFormData}
        isEditing={true}
        onAddFaq={mockOnAddFaq}
        onRemoveFaq={mockOnRemoveFaq}
      />
    );

    // Fill form
    const questionInput = screen.getByLabelText(/question/i);
    const answerInput = screen.getByLabelText(/answer/i);

    fireEvent.change(questionInput, {
      target: { value: 'Traditional FAQ' },
    });
    fireEvent.change(answerInput, {
      target: { value: 'Traditional answer' },
    });

    // Click the Add FAQ button (traditional workflow)
    const addButton = screen.getByText(/add faq/i);
    fireEvent.click(addButton);

    // Verify FAQ was added
    expect(mockOnAddFaq).toHaveBeenCalledWith({
      question: 'Traditional FAQ',
      answer: 'Traditional answer',
      category: 'general',
      keywords: [],
      priority: 1,
    });

    // Verify form is cleared
    await waitFor(() => {
      expect(questionInput).toHaveValue('');
      expect(answerInput).toHaveValue('');
    });

    // After traditional add, addPendingFaq should return false
    const wasAdded = cardRef.current?.addPendingFaq();
    expect(wasAdded).toBe(false);
  });

  test('should handle multiple pending FAQ detections', async () => {
    render(
      <FaqManagementCard
        ref={cardRef}
        formData={mockFormData}
        isEditing={true}
        onAddFaq={mockOnAddFaq}
        onRemoveFaq={mockOnRemoveFaq}
      />
    );

    // Fill form first time
    const questionInput = screen.getByLabelText(/question/i);
    const answerInput = screen.getByLabelText(/answer/i);

    fireEvent.change(questionInput, {
      target: { value: 'First FAQ' },
    });
    fireEvent.change(answerInput, {
      target: { value: 'First answer' },
    });

    // Add first FAQ
    let wasAdded: boolean | undefined;
    act(() => {
      wasAdded = cardRef.current?.addPendingFaq();
    });
    expect(wasAdded).toBe(true);
    expect(mockOnAddFaq).toHaveBeenCalledTimes(1);

    // Wait for form to be cleared, then second call should return false
    await waitFor(() => {
      expect(questionInput).toHaveValue('');
      expect(answerInput).toHaveValue('');
    });
    
    act(() => {
      wasAdded = cardRef.current?.addPendingFaq();
    });
    expect(wasAdded).toBe(false);
    expect(mockOnAddFaq).toHaveBeenCalledTimes(1); // Still 1, no additional calls

    // Fill form again
    fireEvent.change(questionInput, {
      target: { value: 'Second FAQ' },
    });
    fireEvent.change(answerInput, {
      target: { value: 'Second answer' },
    });

    // Add second FAQ
    act(() => {
      wasAdded = cardRef.current?.addPendingFaq();
    });
    expect(wasAdded).toBe(true);
    expect(mockOnAddFaq).toHaveBeenCalledTimes(2);
  });

  test('should display existing FAQs correctly', () => {
    render(
      <FaqManagementCard
        ref={cardRef}
        formData={mockFormData}
        isEditing={false}
        onAddFaq={mockOnAddFaq}
        onRemoveFaq={mockOnRemoveFaq}
      />
    );

    // Verify existing FAQ is displayed
    expect(screen.getByText('Existing FAQ')).toBeInTheDocument();
    expect(screen.getByText('Existing answer')).toBeInTheDocument();
    expect(screen.getByText('general')).toBeInTheDocument();
  });

  test('should show add form only when editing', () => {
    const { rerender } = render(
      <FaqManagementCard
        ref={cardRef}
        formData={mockFormData}
        isEditing={false}
        onAddFaq={mockOnAddFaq}
        onRemoveFaq={mockOnRemoveFaq}
      />
    );

    // Should not show add form when not editing
    expect(screen.queryByText(/add new faq/i)).not.toBeInTheDocument();

    // Should show add form when editing
    rerender(
      <FaqManagementCard
        ref={cardRef}
        formData={mockFormData}
        isEditing={true}
        onAddFaq={mockOnAddFaq}
        onRemoveFaq={mockOnRemoveFaq}
      />
    );

    expect(screen.getByText(/add new faq/i)).toBeInTheDocument();
  });
});