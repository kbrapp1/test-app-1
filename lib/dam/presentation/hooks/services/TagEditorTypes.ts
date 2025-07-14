import { PlainTag } from '../../../application/dto/DamApiRequestDto';
import { SupabaseClient, User } from '@supabase/supabase-js';

// Domain interfaces for tag editor management
export interface UseTagEditorProps {
  assetId: string;
  organizationId: string;
  currentTags: PlainTag[];
  onTagAdded: (newlyAddedTag: PlainTag, allCurrentTags: PlainTag[]) => void;
}

export interface TagEditorState {
  inputValue: string;
  availableActiveTags: PlainTag[];
  allOrgTags: PlainTag[];
  isLoading: boolean;
  error: string | null;
  isPopoverOpen: boolean;
}

export interface TagEditorActions {
  setInputValue: (value: string) => void;
  setError: (error: string | null) => void;
  handlePopoverOpenChange: (open: boolean) => void;
  handleSelectSuggestion: (tag: PlainTag) => Promise<void>;
  handleCreateOrAddTag: (tagName: string) => Promise<void>;
  fetchTagsData: () => Promise<void>;
}

export interface TagEditorComputedData {
  displaySuggestions: PlainTag[];
  canCreateNew: boolean;
}

export interface UseTagEditorReturn extends TagEditorState, TagEditorActions, TagEditorComputedData {}

export interface AuthContext {
  supabase: SupabaseClient;
  user: User | null;
  activeOrgId: string;
} 
