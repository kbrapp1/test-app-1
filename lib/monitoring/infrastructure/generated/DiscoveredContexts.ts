// Auto-generated contexts from build-time discovery - DO NOT EDIT MANUALLY
// Generated: 2025-06-05T04:34:46.559Z
// Run 'npm run generate:contexts' to update

import { PageContext } from '../domain/repositories/PageContextRepository';

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
      "ActionControlPanel",
      "AnalysisResultsPanel",
      "DeduplicationPanel",
      "NetworkCallsList",
      "ServerActionMonitor",
      "NetworkMonitorDisplay",
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
      "dam-gallery",
      "dam-search",
      "dam-dropdown-search",
      "saved-searches"
    ],
    "endpoints": [
      "/api/dam/asset/[assetId]/move",
      "/api/dam/asset/[assetId]",
      "/api/dam/folders",
      "/api/dam/folders/tree",
      "/api/dam/folders/[folderId]/children",
      "/api/dam/folders/[folderId]/path",
      "/api/dam/folders/[folderId]",
      "/api/dam",
      "/api/dam/upload"
    ],
    "optimizationTargets": [
      "Card component memoization",
      "List rendering optimization",
      "Modal lazy loading",
      "Navigation tree optimization",
      "Form validation optimization",
      "Detail view caching",
      "Upload optimization",
      "Layout component optimization",
      "Dynamic route optimization"
    ],
    "cacheableEndpoints": [
      "/api/dam/asset/[assetId]/move",
      "/api/dam/asset/[assetId]",
      "/api/dam/folders",
      "/api/dam/folders/tree",
      "/api/dam/folders/[folderId]/children",
      "/api/dam/folders/[folderId]/path",
      "/api/dam/folders/[folderId]",
      "/api/dam"
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
      "GenerationStats",
      "ActionButtonsToolbar",
      "ImageDisplayArea",
      "ImageGeneratorMain",
      "HeaderModelSelector",
      "ModelSelector",
      "ProviderSelector",
      "EmptyState",
      "ErrorDisplay",
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
      "image-generations"
    ],
    "endpoints": [],
    "optimizationTargets": [
      "Form validation optimization",
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
      "app/(protected)/test-organization-context/page.tsx",
      "app/(protected)/test-organization-services/page.tsx"
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
    "queryKeys": [],
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
      "app/(protected)/settings/network-monitor/page.tsx",
      "app/(protected)/settings/org-roles/page.tsx",
      "app/(protected)/settings/password/page.tsx",
      "app/(protected)/settings/profile/page.tsx",
      "app/(protected)/settings/security/page.tsx"
    ],
    "queryKeys": [],
    "endpoints": [],
    "optimizationTargets": [
      "Modal lazy loading",
      "Form validation optimization",
      "Card component memoization",
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
    "queryKeys": [],
    "endpoints": [],
    "optimizationTargets": [
      "Modal lazy loading",
      "Form validation optimization",
      "Card component memoization",
      "List rendering optimization"
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
    "queryKeys": [],
    "endpoints": [],
    "optimizationTargets": [
      "Modal lazy loading",
      "Card component memoization",
      "List rendering optimization"
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
      "button.stories",
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
    "queryKeys": [],
    "endpoints": [],
    "optimizationTargets": [
      "Modal lazy loading",
      "Card component memoization",
      "Form validation optimization",
      "Navigation tree optimization"
    ],
    "cacheableEndpoints": []
  }
];
