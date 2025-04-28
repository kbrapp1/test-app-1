import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon; // Expect a Lucide icon component
    title: string;
    description: string;
    action?: React.ReactNode; // Allow passing a button or other component
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center space-y-4 p-8 border-2 border-dashed border-muted rounded-lg text-center">
            <Icon className="h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            <p className="text-muted-foreground">{description}</p>
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
} 