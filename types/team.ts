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