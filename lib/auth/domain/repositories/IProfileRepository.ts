/**
 * Profile Repository Interface
 * 
 * AI INSTRUCTIONS:
 * - Define contract for profile data operations
 * - Keep interface focused on profile-specific operations
 * - Use domain value objects and entities
 * - No implementation details in interface
 */

import { UserId } from '../value-objects/UserId';
import { Email } from '../value-objects/Email';
import { UserProfile } from '../aggregates/UserAggregate';

export interface IProfileRepository {
  /**
   * Find profile by user ID
   */
  findById(userId: UserId): Promise<UserProfile | null>;
  
  /**
   * Find profile by email address
   */
  findByEmail(email: Email): Promise<UserProfile | null>;
  
  /**
   * Save profile changes
   */
  save(profile: UserProfile): Promise<void>;
  
  /**
   * Update profile information
   */
  updateProfile(userId: UserId, updates: Partial<{
    firstName: string;
    lastName: string;
    timezone: string;
    language: string;
    avatarUrl: string;
  }>): Promise<void>;
  
  /**
   * Check if profile exists
   */
  exists(userId: UserId): Promise<boolean>;
} 