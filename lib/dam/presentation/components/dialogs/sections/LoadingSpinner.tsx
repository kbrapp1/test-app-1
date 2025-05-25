import React from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export const LoadingSpinner: React.FC = () => {
  return (
    <>
      <DialogHeader className="px-8 py-6 border-b bg-white sticky top-0 z-10">
        <DialogTitle className="text-xl font-semibold text-gray-400 truncate">
          Loading Asset...
        </DialogTitle>
        <DialogDescription className="sr-only">
          Please wait while we load the asset information and preview.
        </DialogDescription>
      </DialogHeader>
      
      <div className="flex-grow flex items-center justify-center p-8" style={{ minHeight: 'calc(24rem + 4rem)' }}>
        <div className="text-center">
          <svg className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-medium text-gray-900">Loading asset details...</p>
          <p className="text-sm text-gray-500">Please wait while we fetch the information</p>
        </div>
      </div>
    </>
  );
}; 
