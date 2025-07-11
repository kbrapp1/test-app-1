// types/notes.ts

export interface Note {
    id: string;        // Assuming ID is string (like UUID)
    user_id?: string;   // Optional on client, required from DB
    organization_id: string; // Required for multi-tenant data isolation
    title: string | null;
    content: string | null;
    created_at?: string; // Optional on client
    updated_at: string | null; // Used for display in note-list-item
    position?: number; // Add position for ordering
    color_class?: string | null; // Store the selected background class
}

// Define structure for color options used in the picker/styling
export interface ColorOption {
    bg: string;
    text: string;
    inputBg: string;
    border: string;
    focusRing: string;
} 