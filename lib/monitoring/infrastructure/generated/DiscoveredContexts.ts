// Auto-generated contexts from build-time discovery - DO NOT EDIT MANUALLY
// Generated: 2025-06-29T14:37:53.122Z
// Run 'npm run generate:contexts' to update

import { PageContext } from '../../domain/repositories/PageContextRepository';

export const DISCOVERED_CONTEXTS: PageContext[] = [
  {
    "domain": "chatbot-widget",
    "components": [
      "AdvancedParametersSection",
      "BotIdentityForm",
      "OperatingHoursForm",
      "BusinessRulesSection",
      "EntityExtractionResults",
      "FunctionCallDetails",
      "IntentClassificationResults",
      "IntentAnalysisSection",
      "JourneyProgressionResults",
      "JourneyProgressionSection",
      "LeadScoringResults",
      "LeadScoringSection",
      "PerformanceMetricsSection",
      "ResponseGenerationSection",
      "UserInputSection",
      "ContextEnhancementStep",
      "FirstApiCallStep",
      "LeadScoringProgressionStep",
      "RequestPreprocessingStep",
      "CompanyInformationCard",
      "FaqManagementCard",
      "KnowledgeBaseActions",
      "KnowledgeBaseSection",
      "AddQuestionForm",
      "LeadQualificationEditor",
      "LeadQualificationOverview",
      "LeadQualificationQuestionItem",
      "LeadSettingsSection",
      "AiConfigurationSection",
      "AutomatedBehaviorsDisplay",
      "LeadScoringDisplay",
      "SystemStatusDisplay",
      "ContextWindowSection",
      "ConversationFlowSection",
      "CustomerJourneyDisplay",
      "DomainStatisticsDisplay",
      "EntityFrameworkDisplay",
      "EnumeratedValuesDisplay",
      "IntentClassificationDisplay",
      "DomainConstantsSection",
      "IntentEntitiesSection",
      "PerformanceSection",
      "ComponentTimingBreakdown",
      "MemoryUsageDetails",
      "NetworkMetrics",
      "PerformanceSummary",
      "SystemHealthStatus",
      "SystemResourceUsage",
      "ApiRequestDetails",
      "ApiResponseDetails",
      "CostAnalysis",
      "PerformanceTiming",
      "ChatApiDebugPanel",
      "ChatConfigurationPanel",
      "ChatInterface",
      "ChatSimulator",
      "TestScenarios",
      "CrawledPagesDisplay",
      "CrawlProgressTracker",
      "WebsiteSourcesDialogs",
      "WebsiteSourcesForm",
      "WebsiteSourcesGettingStarted",
      "WebsiteSourcesHeader",
      "WebsiteSourcesList",
      "WebsiteSourcesMessages",
      "WebsiteSourcesSection",
      "WebsiteSourcesStats",
      "CodeDisplaySection",
      "ConfigurationInfo",
      "EmbedCodeStatusBadge",
      "InstallationInstructions",
      "PlatformNotes",
      "PlatformSelector",
      "EmbedCodeGenerator",
      "WidgetPreview"
    ],
    "files": [
      "lib/chatbot-widget/presentation/components/",
      "lib/chatbot-widget/presentation/hooks/",
      "lib/chatbot-widget/application/services/",
      "lib/chatbot-widget/domain/entities/",
      "app/(protected)/ai-playground/chatbot-widget/analytics/page.tsx",
      "app/(protected)/ai-playground/chatbot-widget/config/page.tsx",
      "app/(protected)/ai-playground/chatbot-widget/knowledge/page.tsx",
      "app/(protected)/ai-playground/chatbot-widget/layout.tsx",
      "app/(protected)/ai-playground/chatbot-widget/leads/page.tsx",
      "app/(protected)/ai-playground/chatbot-widget/page.tsx",
      "app/(protected)/ai-playground/chatbot-widget/parameters/page.tsx",
      "app/(protected)/ai-playground/chatbot-widget/testing/page.tsx",
      "app/(protected)/ai-playground/chatbot-widget/website-sources/page.tsx",
      "app/api/chatbot-widget/chat/route.ts",
      "app/api/chatbot-widget/config/[configId]/route.ts",
      "app/api/chatbot-widget/session/route.ts"
    ],
    "queryKeys": [
      "chatbot-config",
      "chatbot-configs"
    ],
    "endpoints": [
      "/api/chatbot-widget/chat",
      "/api/chatbot-widget/config/[configId]",
      "/api/chatbot-widget/session"
    ],
    "optimizationTargets": [
      "Form validation optimization",
      "Card component memoization",
      "Modal lazy loading",
      "List rendering optimization",
      "Detail view caching",
      "Layout component optimization",
      "Dynamic route optimization"
    ],
    "cacheableEndpoints": [
      "/api/chatbot-widget/chat",
      "/api/chatbot-widget/config/[configId]",
      "/api/chatbot-widget/session"
    ]
  },
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
      "TtsPageClient",
      "VoiceSelector"
    ],
    "files": [
      "lib/tts/presentation/components/",
      "lib/tts/presentation/hooks/",
      "lib/tts/application/actions/",
      "lib/tts/application/services/",
      "lib/tts/domain/entities/"
    ],
    "queryKeys": [
      "ttsPredictionDbId"
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
