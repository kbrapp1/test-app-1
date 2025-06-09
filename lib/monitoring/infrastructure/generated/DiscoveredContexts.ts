// Auto-generated contexts from build-time discovery - DO NOT EDIT MANUALLY
// Generated: 2025-06-09T14:23:06.845Z
// Run 'npm run generate:contexts' to update

import { PageContext } from '../../domain/repositories/PageContextRepository';

export const DISCOVERED_CONTEXTS: PageContext[] = [
  {
    "domain": "dam",
    "components": [
      "AssetActionDropdownMenu",
      "AssetThumbnail",
      "ColoredTag",
      "DomainTagEditor",
      "SelectableEnhancedAssetGridItem",
      "TagCreationOption",
      "TagEditorEmptyState",
      "TagSuggestionList",
      "DragOverlay",
      "index",
      "DamDragDropProvider",
      "AssetDetailsModal",
      "AssetSelectorModal",
      "BulkOperationManager",
      "BulkDeleteDialog",
      "BulkDownloadDialog",
      "BulkMoveDialog",
      "BulkTagDialog",
      "BulkOperationDialogs",
      "FolderTreeRenderer",
      "ConfirmationDialog",
      "DeleteFolderDialog",
      "DialogShowcase",
      "FolderPickerDialog",
      "FolderTreeItem",
      "InputDialog",
      "NewFolderDialog",
      "RenameFolderDialog",
      "AssetDetailsHeader",
      "AssetPreviewSection",
      "LoadingSpinner",
      "DamErrorBoundary",
      "FolderNotFoundHandler",
      "CustomDateRangePicker",
      "DateOptionsList",
      "CreationDateFilter",
      "DamTagFilter",
      "OwnerFilter",
      "SizeFilter",
      "SizeFilterCustomView",
      "SizeFilterListView",
      "SortControl",
      "TypeFilter",
      "FolderListItem",
      "FolderThumbnail",
      "FolderActionMenu",
      "InteractionHint",
      "SelectableFolderGrid",
      "SelectableFolderList",
      "SelectableFolderItem",
      "AssetGalleryClient",
      "AssetGalleryRenderer",
      "AssetListItem",
      "EnhancedAssetGridItem",
      "PatternDemo",
      "UXComparison",
      "FolderItemGrid",
      "FolderItemList",
      "SelectionOverlay",
      "FolderItem",
      "GalleryDialogs",
      "GalleryLayout",
      "ContentSections",
      "EmptyState",
      "GalleryHeader",
      "UploadProgress",
      "FolderActionsMenu",
      "FolderExpandButton",
      "FolderLink",
      "DamBreadcrumbs",
      "FolderBreadcrumbs",
      "FolderNavigationItem",
      "FolderSidebar",
      "SavedSearchBrowseTab",
      "SavedSearchDialog",
      "SavedSearchList",
      "SavedSearchSaveTab",
      "SearchActions",
      "SearchCriteriaPreview",
      "SearchForm",
      "DamSearchBar",
      "SavedSearchButton",
      "SearchDropdownMenu",
      "MultiSelectToggle",
      "SelectionCheckbox",
      "SelectionModeToggle",
      "SelectionToolbar",
      "AssetUploader",
      "DamUploadButton",
      "DamWorkspaceView",
      "WorkspaceFilters",
      "WorkspaceHeader"
    ],
    "files": [
      "lib/dam/presentation/components/",
      "lib/dam/presentation/hooks/",
      "lib/dam/application/actions/",
      "lib/dam/application/services/",
      "lib/dam/domain/entities/",
      "app/(protected)/dam/page.tsx",
      "app/(protected)/dam/layout.tsx",
      "app/(protected)/dam/upload/page.tsx",
      "app/api/dam/asset/[assetId]/move/route.ts",
      "app/api/dam/asset/[assetId]/route.ts",
      "app/api/dam/folders/route.ts",
      "app/api/dam/folders/tree/route.ts",
      "app/api/dam/folders/[folderId]/children/route.ts",
      "app/api/dam/folders/[folderId]/path/route.ts",
      "app/api/dam/folders/[folderId]/route.ts",
      "app/api/dam/route.ts",
      "app/api/dam/upload/route.ts"
    ],
    "queryKeys": [
      "damSelectionUpdate",
      "damGetSelection",
      "damClearSelection",
      "damExitSelectionMode",
      "list",
      "targetFolderId",
      "dam-gallery",
      "dam-search",
      "search",
      "damViewMode",
      "damViewModeChange",
      "damDataRefresh",
      "dam-dropdown-search",
      "quickSearch",
      "saved-searches",
      "useDamSearchDropdown"
    ],
    "endpoints": [
      "/api/dam",
      "/api/dam/asset/[assetId]",
      "/api/dam/asset/[assetId]/move",
      "/api/dam/folders",
      "/api/dam/folders/tree",
      "/api/dam/folders/[folderId]",
      "/api/dam/folders/[folderId]/children",
      "/api/dam/folders/[folderId]/path",
      "/api/dam/upload"
    ],
    "optimizationTargets": [
      "Card component memoization",
      "Table virtualization",
      "List rendering optimization",
      "Modal lazy loading",
      "Navigation tree optimization",
      "Search debouncing optimization",
      "Form validation optimization",
      "Detail view caching",
      "Upload optimization",
      "Layout component optimization",
      "Upload page optimization",
      "Dynamic route optimization"
    ],
    "cacheableEndpoints": [
      "/api/dam",
      "/api/dam/asset/[assetId]",
      "/api/dam/asset/[assetId]/move",
      "/api/dam/folders",
      "/api/dam/folders/tree",
      "/api/dam/folders/[folderId]",
      "/api/dam/folders/[folderId]/children",
      "/api/dam/folders/[folderId]/path"
    ]
  },
  {
    "domain": "image-generator",
    "components": [
      "GenerationActionButtons",
      "ImagePromptForm",
      "PromptSection",
      "ImageSizeSelector",
      "ImageDimensionsSection",
      "ImageUploadSection",
      "SettingsSection",
      "StyleSection",
      "GenerationActions",
      "GenerationImage",
      "GenerationInfo",
      "GenerationHistory",
      "GenerationSearchBar",
      "HistoryPanel",
      "GenerationEmptyState",
      "GenerationListItem",
      "ActionButtonsToolbar",
      "ImageDisplayArea",
      "ImageGeneratorMain",
      "LazyComponentLoader",
      "HeaderModelSelector",
      "ModelSelector",
      "ProviderSelector",
      "EmptyState",
      "ErrorDisplay",
      "GenerationErrorBoundary",
      "LazyLoadWrapper",
      "PresetPrompts",
      "CollapsibleSection"
    ],
    "files": [
      "lib/image-generator/presentation/components/",
      "lib/image-generator/presentation/hooks/",
      "lib/image-generator/application/actions/",
      "lib/image-generator/application/services/",
      "lib/image-generator/domain/entities/",
      "app/(protected)/ai-playground/image-generator/page.tsx"
    ],
    "queryKeys": [
      "list",
      "search",
      "image-generator-file-upload",
      "image-generator-model-selector",
      "image-generator-state",
      "prefetch",
      "fetchPriority"
    ],
    "endpoints": [],
    "optimizationTargets": [
      "Form validation optimization",
      "Search debouncing optimization",
      "List rendering optimization",
      "Card component memoization"
    ],
    "cacheableEndpoints": []
  },
  {
    "domain": "organization",
    "components": [
      "OrganizationSwitcher"
    ],
    "files": [
      "lib/organization/presentation/components/",
      "lib/organization/presentation/hooks/",
      "lib/organization/application/services/"
    ],
    "queryKeys": [],
    "endpoints": [],
    "optimizationTargets": [
      "Data loading optimization",
      "Component rendering optimization",
      "Page load optimization"
    ],
    "cacheableEndpoints": []
  },
  {
    "domain": "auth",
    "components": [
      "login-form",
      "OrganizationSelector",
      "OrganizationSelectorDropdown",
      "signup-form",
      "SuperAdminBadge"
    ],
    "files": [
      "components/auth/"
    ],
    "queryKeys": [],
    "endpoints": [],
    "optimizationTargets": [
      "Form validation optimization"
    ],
    "cacheableEndpoints": []
  },
  {
    "domain": "error",
    "components": [
      "error-fallback"
    ],
    "files": [
      "components/error/"
    ],
    "queryKeys": [],
    "endpoints": [],
    "optimizationTargets": [
      "Data loading optimization",
      "Component rendering optimization",
      "Page load optimization"
    ],
    "cacheableEndpoints": []
  },
  {
    "domain": "forms",
    "components": [
      "CheckboxField",
      "CustomField",
      "SwitchField",
      "TextareaField",
      "TextField",
      "FormField",
      "FormWrapper",
      "SelectField"
    ],
    "files": [
      "components/forms/"
    ],
    "queryKeys": [],
    "endpoints": [],
    "optimizationTargets": [
      "Form validation optimization"
    ],
    "cacheableEndpoints": []
  },
  {
    "domain": "notes",
    "components": [
      "add-note-dialog",
      "add-note-form",
      "note-edit-form",
      "note-list-item",
      "note-list"
    ],
    "files": [
      "components/notes/",
      "app/(protected)/documents/notes/page.tsx"
    ],
    "queryKeys": [
      "NoteListItem"
    ],
    "endpoints": [],
    "optimizationTargets": [
      "Modal lazy loading",
      "Form validation optimization",
      "List rendering optimization",
      "Card component memoization"
    ],
    "cacheableEndpoints": []
  },
  {
    "domain": "providers",
    "components": [
      "toast-provider"
    ],
    "files": [
      "components/providers/"
    ],
    "queryKeys": [],
    "endpoints": [],
    "optimizationTargets": [
      "Data loading optimization",
      "Component rendering optimization",
      "Page load optimization"
    ],
    "cacheableEndpoints": []
  },
  {
    "domain": "settings",
    "components": [
      "AddMemberDialog",
      "danger-zone",
      "email-form",
      "OrgMemberCard",
      "OrgMembersDesktopTable",
      "OrgMembersTable.columns",
      "OrgMembersTable",
      "OrgRoleManager",
      "password-form",
      "profile-form",
      "RemoveMemberDialog",
      "security-section"
    ],
    "files": [
      "components/settings/",
      "app/(protected)/settings/page.tsx",
      "app/(protected)/settings/layout.tsx",
      "app/(protected)/settings/danger/page.tsx",
      "app/(protected)/settings/email/page.tsx",
      "app/(protected)/settings/org-roles/page.tsx",
      "app/(protected)/settings/password/page.tsx",
      "app/(protected)/settings/profile/page.tsx",
      "app/(protected)/settings/security/page.tsx"
    ],
    "queryKeys": [
      "search"
    ],
    "endpoints": [],
    "optimizationTargets": [
      "Modal lazy loading",
      "Form validation optimization",
      "Card component memoization",
      "Table virtualization",
      "Settings page optimization",
      "Layout component optimization"
    ],
    "cacheableEndpoints": []
  },
  {
    "domain": "team",
    "components": [
      "AddTeamMemberDialog",
      "AddTeamMemberForm",
      "TeamMemberCard",
      "TeamMemberList"
    ],
    "files": [
      "components/team/",
      "app/(protected)/team/page.tsx",
      "app/api/team/members/route.ts",
      "app/api/team/upload/route.ts"
    ],
    "queryKeys": [
      "AddTeamMemberDialog",
      "AddTeamMemberForm",
      "TeamMemberCard",
      "team-member-card",
      "TeamMemberList"
    ],
    "endpoints": [],
    "optimizationTargets": [
      "Modal lazy loading",
      "Form validation optimization",
      "Card component memoization",
      "List rendering optimization",
      "Upload page optimization"
    ],
    "cacheableEndpoints": []
  },
  {
    "domain": "tts",
    "components": [
      "SaveAsDialog",
      "tts-interface",
      "TtsHistoryItem",
      "TtsHistoryItemActions",
      "TtsHistoryItemErrorDisplay",
      "TtsHistoryItemInfo",
      "TtsHistoryList",
      "TtsHistoryPanel",
      "TtsHistoryPanelHeader",
      "TtsHistoryPanelSearch",
      "TtsInputCard",
      "TtsOutputCard",
      "VoiceSelector"
    ],
    "files": [
      "components/tts/"
    ],
    "queryKeys": [
      "TtsPrediction",
      "TtsHistoryItem",
      "tts-history-item-reload",
      "tts-history-item-play",
      "tts-history-item-save",
      "tts-history-item-save-as",
      "tts-history-item-delete",
      "TtsHistoryPanel",
      "TtsInputCard",
      "TtsOutputCard",
      "command-list"
    ],
    "endpoints": [],
    "optimizationTargets": [
      "Modal lazy loading",
      "Card component memoization",
      "List rendering optimization",
      "Search debouncing optimization"
    ],
    "cacheableEndpoints": []
  },
  {
    "domain": "ui",
    "components": [
      "accordion",
      "alert-dialog",
      "alert",
      "aspect-ratio",
      "avatar",
      "badge",
      "breadcrumb",
      "button",
      "calendar",
      "card",
      "carousel",
      "chart",
      "checkbox",
      "collapsible",
      "command",
      "context-menu",
      "dialog",
      "drawer",
      "dropdown-menu",
      "empty-state",
      "form",
      "hover-card",
      "input-otp",
      "input",
      "label",
      "menubar",
      "navigation-menu",
      "pagination",
      "popover",
      "progress",
      "radio-group",
      "resizable",
      "scroll-area",
      "select",
      "separator",
      "sheet",
      "sidebar",
      "skeleton",
      "slider",
      "sonner",
      "switch",
      "table",
      "tabs",
      "textarea",
      "toast",
      "toaster",
      "toggle-group",
      "toggle",
      "tooltip",
      "use-mobile",
      "waveform-audio-player"
    ],
    "files": [
      "components/ui/",
      "app/(protected)/brand-guidelines/page.tsx"
    ],
    "queryKeys": [
      "BreadcrumbList",
      "search",
      "SidebarMenuItem",
      "fetch"
    ],
    "endpoints": [],
    "optimizationTargets": [
      "Modal lazy loading",
      "Card component memoization",
      "Form validation optimization",
      "Navigation tree optimization",
      "Table virtualization"
    ],
    "cacheableEndpoints": []
  }
];
