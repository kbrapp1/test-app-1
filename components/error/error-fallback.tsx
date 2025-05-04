'use client'

import React from 'react';
import { Button } from '@/components/ui/button'; // Assuming shadcn Button

interface ErrorFallbackProps {
  error: Error | null;
  resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div 
      role="alert" 
      className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center"
    >
      <h2 className="text-xl font-semibold text-destructive mb-4">Something went wrong.</h2>
      {error && (
        <pre className="mb-4 p-2 text-sm bg-muted rounded text-destructive-foreground whitespace-pre-wrap break-words max-w-lg">
          {error.message || 'An unknown error occurred'}
        </pre>
      )}
      <Button onClick={resetErrorBoundary}>Try again</Button>
    </div>
  );
} 