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
    FileCodeIcon,
    UploadCloudIcon,
    Volume2Icon,
    BookTextIcon,
} from "lucide-react";

// Define the types for navigation items
export interface NavItem {
    title: string;
    url: string; // URL for the main item or '#' for collapsible trigger
    icon: LucideIcon;
    label?: string; // Optional label (e.g., for beta features)
    items?: NavSubItem[]; // Sub-items for collapsible sections
    collapsible?: boolean; // Flag to indicate this item should be collapsible
}

export interface NavSubItem {
    title: string;
    url: string;
    label?: string;
    icon?: LucideIcon; // Optional icon for sub-items
}

// Export the navigation data arrays

export const navMainItems: NavItem[] = [
    {
        title: "Dashboard",
        url: "/dashboard", // Use actual target path
        icon: LayoutDashboardIcon,
    },
    {
        title: "Documents", // New Collapsible Section
        url: "#", // No direct link for the trigger
        icon: FolderIcon, // Or another suitable icon like FileTextIcon
        collapsible: true,
        items: [
            {
                title: "Notes",
                url: "/documents/notes",
                icon: FileTextIcon,
            },
            {
                title: "Asset Library",
                url: "/dam",
                icon: UploadCloudIcon,
            },
            // Add other document-related items here if needed
            // {
            //     title: "Data Library",
            //     url: "#",
            //     icon: DatabaseIcon,
            // },
            // {
            //     title: "Reports",
            //     url: "#",
            //     icon: ClipboardListIcon,
            // },
            // {
            //     title: "Word Assistant",
            //     url: "#",
            //     icon: FileIcon,
            // },
        ],
    },
    // Add other main navigation items here based on your desired scaffold structure
    // Example:
    // {
    //   title: "Analytics",
    //   url: "/analytics",
    //   icon: BarChartIcon,
    // },
    {
        title: "Team",
        url: "/team", // Updated to point to the Team page
        icon: UsersIcon,
    },
    {
        title: "Playbooks",
        url: "/playbooks", 
        icon: BookTextIcon,
    },
    {
        title: "AI Playground",
        url: "#", // Change URL to # for collapsible trigger
        icon: FileCodeIcon,
        collapsible: true, // Make it collapsible
        items: [ // Add sub-items
            {
                title: "Text to Speech",
                url: "/ai-playground/text-to-speech", // Define sub-item route
                icon: Volume2Icon, // Add icon
            },
            // Add other AI playground sub-items here later if needed
        ],
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