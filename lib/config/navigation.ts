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
    FileCodeIcon
} from "lucide-react";

// Define the types for navigation items
export interface NavItem {
    title: string;
    url: string;
    icon: LucideIcon;
    label?: string; // Optional label (e.g., for beta features)
    items?: NavSubItem[]; // Optional sub-items for nested navigation (used in NavMain originally)
}

export interface NavSubItem {
    title: string;
    url: string;
    label?: string;
}

// Define the type for document items (slightly different structure)
export interface DocumentItem {
    name: string;
    url: string;
    icon: LucideIcon;
}

// Export the navigation data arrays

export const navMainItems: NavItem[] = [
    {
        title: "Dashboard",
        url: "/dashboard", // Use actual target path
        icon: LayoutDashboardIcon,
    },
    // Add other main navigation items here based on your desired scaffold structure
    // Example:
    // {
    //   title: "Analytics",
    //   url: "/analytics",
    //   icon: BarChartIcon,
    // },
    {
        title: "Projects",
        url: "#", // Placeholder URL
        icon: FolderIcon,
    },
    {
        title: "Team",
        url: "#", // Placeholder URL
        icon: UsersIcon,
    },
];

export const navDocumentsItems: DocumentItem[] = [
    {
        name: "Data Library",
        url: "#",
        icon: DatabaseIcon,
    },
    {
        name: "Reports",
        url: "#",
        icon: ClipboardListIcon,
    },
    {
        name: "Word Assistant",
        url: "#",
        icon: FileIcon,
    },
    {
        name: "Notes",
        url: "/documents/notes", // Point to the new page
        icon: FileTextIcon, // Use an appropriate icon
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
export const navExampleWithSubItems: NavItem[] = [
     {
       title: "Capture",
       icon: CameraIcon,
       url: "#",
       items: [
         {
           title: "Active Proposals",
           url: "#",
         },
         {
           title: "Archived",
           url: "#",
         },
       ],
     },
     {
       title: "Proposal",
       icon: FileTextIcon,
       url: "#",
       items: [
         {
           title: "Active Proposals",
           url: "#",
         },
         {
           title: "Archived",
           url: "#",
         },
       ],
     },
     {
       title: "Prompts",
       icon: FileCodeIcon,
       url: "#",
       items: [
         {
           title: "Active Proposals",
           url: "#",
         },
         {
           title: "Archived",
           url: "#",
         },
       ],
     },
]; 