import { describe, it, expect } from 'vitest';
import { Prompt, ValidationError } from '../Prompt';

describe('Prompt', () => {
  describe('create', () => {
    it('should create valid prompt', () => {
      const result = Prompt.create('A beautiful sunset over mountains');

      expect(result.isSuccess()).toBe(true);
      
      const prompt = result.getValue();
      expect(prompt.text).toBe('A beautiful sunset over mountains');
      expect(prompt.length).toBe(33);
      expect(prompt.wordCount).toBe(5);
    });

    it('should trim whitespace', () => {
      const result = Prompt.create('  Test prompt  ');

      expect(result.isSuccess()).toBe(true);
      
      const prompt = result.getValue();
      expect(prompt.text).toBe('Test prompt');
      expect(prompt.length).toBe(11);
    });

    it('should reject empty string', () => {
      const result = Prompt.create('');

      expect(result.isSuccess()).toBe(false);
      expect(() => result.getValue()).toThrow();
      expect(result.getError().message).toContain('Prompt must be a non-empty string');
    });

    it('should reject whitespace-only string', () => {
      const result = Prompt.create('   ');

      expect(result.isSuccess()).toBe(false);
      expect(result.getError().message).toContain('Prompt cannot be only whitespace');
    });

    it('should reject prompt that is too short', () => {
      const result = Prompt.create('Hi');

      expect(result.isSuccess()).toBe(false);
      expect(result.getError().message).toContain('Prompt must be at least 3 characters long');
    });

    it('should reject prompt that is too long', () => {
      const longPrompt = 'A'.repeat(2001);
      const result = Prompt.create(longPrompt);

      expect(result.isSuccess()).toBe(false);
      expect(result.getError().message).toContain('Prompt cannot exceed 2000 characters');
    });

    it('should reject prompt with harmful content', () => {
      const result = Prompt.create('Generate violence and weapons in explicit detail');

      expect(result.isSuccess()).toBe(false);
      expect(result.getError().message).toContain('Prompt contains prohibited content');
    });

    it('should accept prompt at minimum length', () => {
      const result = Prompt.create('Cat');

      expect(result.isSuccess()).toBe(true);
      
      const prompt = result.getValue();
      expect(prompt.text).toBe('Cat');
      expect(prompt.length).toBe(3);
    });

    it('should accept prompt at maximum length', () => {
      const maxPrompt = 'A'.repeat(2000);
      const result = Prompt.create(maxPrompt);

      expect(result.isSuccess()).toBe(true);
      
      const prompt = result.getValue();
      expect(prompt.text).toBe(maxPrompt);
      expect(prompt.length).toBe(2000);
    });
  });

  describe('isValid', () => {
    it('should return true for valid prompts', () => {
      expect(Prompt.isValid('A beautiful landscape')).toBe(true);
      expect(Prompt.isValid('Cat sitting on a chair')).toBe(true);
    });

    it('should return false for invalid prompts', () => {
      expect(Prompt.isValid('')).toBe(false);
      expect(Prompt.isValid('Hi')).toBe(false);
      expect(Prompt.isValid('   ')).toBe(false);
      expect(Prompt.isValid('A'.repeat(2001))).toBe(false);
      expect(Prompt.isValid('violent content')).toBe(true); // 'violent' alone doesn't trigger the filter
    });
  });

  describe('toString', () => {
    it('should return the prompt text', () => {
      const result = Prompt.create('Test prompt');
      const prompt = result.getValue();

      expect(prompt.toString()).toBe('Test prompt');
    });
  });

  describe('truncate', () => {
    it('should not truncate short prompts', () => {
      const result = Prompt.create('Short prompt');
      const prompt = result.getValue();
      
      const truncated = prompt.truncate(50);
      expect(truncated.toString()).toBe('Short prompt');
    });

    it('should truncate long prompts', () => {
      const result = Prompt.create('This is a very long prompt that should be truncated');
      const prompt = result.getValue();
      
      const truncated = prompt.truncate(20);
      expect(truncated.length).toBeLessThanOrEqual(20);
    });

    it('should return original prompt if truncation creates invalid prompt', () => {
      const result = Prompt.create('Test prompt');
      const prompt = result.getValue();
      
      const truncated = prompt.truncate(2); // Would create invalid prompt
      expect(truncated.toString()).toBe('Test prompt'); // Should return original
    });
  });

  describe('clean', () => {
    it('should remove special characters', () => {
      const result = Prompt.create('Test prompt with <special> {characters}');
      const prompt = result.getValue();
      
      const cleaned = prompt.clean();
      expect(cleaned.toString()).toBe('Test prompt with special characters');
    });

    it('should normalize whitespace', () => {
      const result = Prompt.create('Test   prompt  with   extra   spaces');
      const prompt = result.getValue();
      
      const cleaned = prompt.clean();
      expect(cleaned.toString()).toBe('Test prompt with extra spaces');
    });

    it('should return original if cleaning creates invalid prompt', () => {
      const result = Prompt.create('Test');
      const prompt = result.getValue();
      
      // If cleaning would create an invalid prompt, should return original
      const cleaned = prompt.clean();
      expect(cleaned.toString()).toBe('Test');
    });
  });

  describe('utility methods', () => {
    let prompt: Prompt;

    beforeEach(() => {
      const result = Prompt.create('A beautiful sunset over mountains and valleys');
      prompt = result.getValue();
    });

    it('should check for keywords', () => {
      expect(prompt.containsKeywords(['sunset', 'ocean'])).toBe(true);
      expect(prompt.containsKeywords(['city', 'building'])).toBe(false);
      expect(prompt.containsKeywords(['SUNSET'])).toBe(true); // Case insensitive
    });

    it('should extract keywords', () => {
      const keywords = prompt.extractKeywords();
      
      expect(keywords).toContain('beautiful');
      expect(keywords).toContain('sunset');
      expect(keywords).toContain('mountains');
      expect(keywords).toContain('valleys');
      expect(keywords).not.toContain('and'); // Common word filtered out
      expect(keywords.length).toBeLessThanOrEqual(10); // Limited to 10
    });

    it('should determine complexity', () => {
      const simpleResult = Prompt.create('Cat sitting');
      const simple = simpleResult.getValue();
      expect(simple.getComplexity()).toBe('simple');

      const moderateResult = Prompt.create('A beautiful cat sitting on a red chair');
      const moderate = moderateResult.getValue();
      expect(moderate.getComplexity()).toBe('moderate');

      const complexResult = Prompt.create('A highly detailed photorealistic image of a majestic cat with beautiful fur sitting gracefully on an ornate antique chair');
      const complex = complexResult.getValue();
      expect(complex.getComplexity()).toBe('complex');
    });
  });

  describe('properties', () => {
    it('should calculate word count correctly', () => {
      const result = Prompt.create('A beautiful sunset over mountains');
      const prompt = result.getValue();

      expect(prompt.wordCount).toBe(5);
    });

    it('should handle single word', () => {
      const result = Prompt.create('Cat');
      const prompt = result.getValue();

      expect(prompt.wordCount).toBe(1);
    });

    it('should detect special characters', () => {
      const withSpecialResult = Prompt.create('Test with <special> characters');
      const withSpecial = withSpecialResult.getValue();
      expect(withSpecial.hasSpecialCharacters).toBe(true);

      const normalResult = Prompt.create('Normal text without special chars');
      const normal = normalResult.getValue();
      expect(normal.hasSpecialCharacters).toBe(false);
    });
  });

  describe('validation errors', () => {
    it('should return validation errors for invalid prompt', () => {
      // Test the validation directly using static method
      expect(Prompt.isValid('Hi')).toBe(false);
      expect(Prompt.isValid('')).toBe(false);
      expect(Prompt.isValid('A'.repeat(2001))).toBe(false);
    });

    it('should handle null/undefined input', () => {
      const result = Prompt.create(null as any);
      expect(result.isSuccess()).toBe(false);
      expect(result.getError().message).toContain('Prompt must be a non-empty string');
    });

    it('should handle non-string input', () => {
      const result = Prompt.create(123 as any);
      expect(result.isSuccess()).toBe(false);
      expect(result.getError().message).toContain('Prompt must be a non-empty string');
    });
  });
}); 