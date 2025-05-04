/**
 * Team-related type definitions
 * 
 * This file contains interfaces and types related to team functionality,
 * including team members, team settings, and team-specific form schemas.
 * 
 * These types are used throughout the application for type safety when
 * working with team data from the API and in form submissions.
 */


export interface TeamMember {
  id: string;
  name: string;
  title: string;
  primary_image_url: string;
  secondary_image_url: string;
  created_at: string;
  // Note: Database stores paths, but actions/components use URLs
  // Add paths if needed for specific contexts, but keep URLs for general use
  // primary_image_path?: string;
  // secondary_image_path?: string;
} 