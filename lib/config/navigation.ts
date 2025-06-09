import type { LucideIcon } from "lucide-react";
import {
    LayoutDashboardIcon,
    ListIcon,
    BarChartIcon,
    FolderIcon,
    UsersIcon,
    SettingsIcon,
    HelpCircleIcon,
    SearchIcon,
    DatabaseIcon,
    ClipboardListIcon,
    FileIcon,
    CameraIcon,
    FileTextIcon,
    BotIcon,
    UploadCloudIcon,
    Volume2Icon,
    BookTextIcon,
    StoreIcon,
    PlugIcon,
    BellIcon,
    ActivityIcon,
    CheckCircleIcon,
    MegaphoneIcon,
    CalendarIcon,
    LightbulbIcon,
    PaletteIcon,
    CodeIcon,
    FlameIcon,
    CogIcon,
    BriefcaseIcon,
    FilterIcon,
    DollarSignIcon,
    UsersRoundIcon,
    MessageCircleIcon,
    TestTube,
} from "lucide-react";

// Define the types for navigation items
export interface NavItem {
    title: string;
    url: string; // URL for the main item or '#' for collapsible trigger
    icon: LucideIcon;
    label?: string; // Optional label (e.g., for beta features)
    items?: NavSubItem[]; // Sub-items for collapsible sections
    collapsible?: boolean; // Flag to indicate this item should be collapsible
    superAdminOnly?: boolean; // Flag to restrict access to super admins only
    featureFlag?: string; // Flag to control visibility based on organization entitlements
}

export interface NavSubItem {
    title: string;
    url: string;
    label?: string;
    icon?: LucideIcon; // Optional icon for sub-items
    featureFlag?: string; // Flag to control visibility based on organization entitlements
}

// Export the navigation data arrays

export const navMainItems: NavItem[] = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboardIcon,
    },
    {
        title: "Digital Asset Management",
        url: "#",
        icon: FolderIcon,
        collapsible: true,
        featureFlag: 'dam',
        items: [
            { title: "Notes", url: "/documents/notes", icon: FileTextIcon },
            { title: "Asset Library", url: "/dam", icon: UploadCloudIcon },
        ],
    },
    {
        title: "Collaboration",
        url: "#",
        icon: UsersIcon,
        collapsible: true,
        items: [
            { title: "Team", url: "/team", icon: UsersIcon },
            { title: "Notifications", url: "/notifications", icon: BellIcon },
            { title: "Activity Feed", url: "/activity-feed", icon: ActivityIcon },
            { title: "Approvals", url: "/approvals", icon: CheckCircleIcon },
        ],
    },
    {
        title: "Playbooks",
        url: "#",
        icon: BookTextIcon,
        collapsible: true,
        items: [
            { title: "Templates Library", url: "/templates", icon: FileIcon },
            { title: "Jobs", url: "/playbooks/jobs", icon: BriefcaseIcon },
        ]
    },
    {
        title: "Marketing Automation",
        url: "#",
        icon: CogIcon,
        collapsible: true,
        items: [
            { title: "Campaign Management", url: "/campaign-management", icon: ListIcon },
            { title: "Content Calendar", url: "/content-calendar", icon: CalendarIcon },
            { title: "Contacts", url: "/marketing-automation/contacts", icon: UsersIcon },
            { title: "Leads", url: "/marketing-automation/leads", icon: FilterIcon },
            { title: "Opportunities", url: "/marketing-automation/opportunities", icon: DollarSignIcon },
            { title: "Customers", url: "/marketing-automation/customers", icon: UsersRoundIcon },
        ],
    },
    {
        title: "Analytics",
        url: "#",
        icon: BarChartIcon,
        collapsible: true,
        items: [
            { title: "Reporting", url: "/reporting", icon: ClipboardListIcon },
            { title: "Insights & Recommendations", url: "/insights", icon: LightbulbIcon },
        ],
    },
    {
        title: "Ignition",
        url: "#",
        icon: FlameIcon,
        collapsible: true,
        items: [
            { title: "Digital Storefront", url: "/digital-storefront", icon: StoreIcon },
            { title: "Assets", url: "/digital-storefront/assets-overview", icon: CameraIcon },
            { title: "Brand Guidelines", url: "/brand-guidelines", icon: PaletteIcon },
        ],
    },
    {
        title: "Integrations & API",
        url: "#",
        icon: PlugIcon,
        collapsible: true,
        items: [
            { title: "Integrations", url: "/integrations", icon: PlugIcon },
            { title: "Developer API & Webhooks", url: "/developer-api", icon: CodeIcon },
        ],
    },
    {
        title: "AI Playground",
        url: "#",
        icon: BotIcon,
        collapsible: true,
        items: [
            { title: "Image Generator", url: "/ai-playground/image-generator", icon: CameraIcon },
            { title: "Text to Speech", url: "/ai-playground/text-to-speech", icon: Volume2Icon, featureFlag: 'tts' },
            { title: "Chatbot", url: "/ai-playground/chatbot", icon: MessageCircleIcon },
        ],
    },
    {
        title: "Testing Tools",
        url: "/testing-tools",
        icon: TestTube,
        label: "Super Admin",
        superAdminOnly: true,
    },
];

// Note: The secondary nav often includes settings, help, etc.
export const navSecondaryItems: NavItem[] = [
    {
        title: "Settings",
        url: "/settings", // Example URL
        icon: SettingsIcon,
    },
    {
        title: "Get Help",
        url: "#", // Placeholder URL
        icon: HelpCircleIcon,
    },
    // Search might be better handled by the Command Palette now
    // {
    //   title: "Search",
    //   url: "#",
    //   icon: SearchIcon,
    // },
];

// Example for items with sub-items (originally 'navClouds' in AppSidebar data)
// This structure might need adaptation depending on how NavMain handles sub-items
// Remove or adapt navExampleWithSubItems if no longer needed or update its structure
// export const navExampleWithSubItems: NavItem[] = [ ... ]; 