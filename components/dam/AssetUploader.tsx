'use client';

import React, { useState, useCallback, useTransition, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
// Input is used by dropzone internally, no need to render it explicitly if using button trigger
// import { Input } from '@/components/ui/input';
import { toast as sonnerToast } from "sonner"; // Import sonner directly
import { createClient } from '@/lib/supabase/client'; // Import browser client
import type { User } from '@supabase/supabase-js';

// Define accepted file types
const ACCEPTED_IMAGE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
};

// No longer defining server action here

// --- Client Component ---
export function AssetUploader() {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition(); // Keep for loading state
  const [user, setUser] = useState<User | null>(null); // State to hold user session
  const supabase = createClient(); // Initialize browser client

  // Fetch user session on component mount
  useEffect(() => {
    const getUser = async () => {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
    };
    getUser();
  }, [supabase.auth]); // Re-run if auth object changes

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    setError(null); // Clear previous errors
    if (fileRejections.length > 0) {
      const rejectionError = fileRejections[0].errors[0].message || 'Invalid file type selected.';
      setError(rejectionError);
      setFiles([]);
    } else {
      setFiles(acceptedFiles);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject, open } = useDropzone({
    onDrop,
    accept: ACCEPTED_IMAGE_TYPES,
    multiple: true,
    noClick: true,
    noKeyboard: true,
  });

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (files.length === 0) {
      setError('Please select at least one file to upload.');
      return;
    }
    // Check if user session is loaded
    if (!user) {
        setError('User session not loaded. Please wait or try refreshing.');
        sonnerToast.error("Upload Failed", { description: "User session not available." });
        return;
    }
    setError(null);

    const formData = new FormData();
    files.forEach((file) => {
        formData.append('files', file);
    });
    // Append the user ID
    formData.append('userId', user.id);

    startTransition(async () => {
        try {
            const response = await fetch('/api/dam/upload', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || `HTTP error! status: ${response.status}`);

            sonnerToast.success("Upload Successful", { description: `${result.data?.length || 0} file(s) uploaded.` });
            setFiles([]);
        } catch (err: any) {
            console.error('Upload failed:', err);
            const errorMessage = err.message || 'An unknown error occurred during upload.';
            sonnerToast.error("Upload Failed", { description: errorMessage });
            setError(errorMessage);
        }
    });
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div
        {...getRootProps({
          className: `
            border-2 border-dashed rounded-lg p-8 text-center 
            transition-colors duration-200 ease-in-out 
            ${isDragAccept ? 'border-green-500 bg-green-50' : ''}
            ${isDragReject ? 'border-red-500 bg-red-50' : ''}
            ${isDragActive ? 'border-blue-500' : 'border-gray-300'}
          `,
        })}
      >
        {/* Input is hidden, managed by dropzone */}
        <input {...getInputProps()} data-testid="dropzone-input" />
        <p className="mb-2">
            {isDragActive ?
                (isDragReject ? 'Invalid file type...' : 'Drop the files here ...') :
                'Drag &apos;n&apos; drop some files here, or click the button below'
            }
        </p>
         {/* Button to trigger file selection dialog */}
        <Button type="button" variant="outline" onClick={open} disabled={isPending}>
            Select Files
        </Button>
        <p className="text-xs text-gray-500 mt-2">
          Accepted formats: JPG, PNG, GIF, WEBP
        </p>
      </div>

      {/* File Preview Area */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="font-semibold">Selected Files:</h4>
          <ul className="list-disc list-inside text-sm">
            {files.map((file) => (
              <li key={`${file.name}-${file.lastModified}`}>{file.name} - {(file.size / 1024).toFixed(2)} KB</li>
            ))}
          </ul>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <p className="text-sm text-red-600 mt-2">Error: {error}</p>
      )}

      <Button type="submit" disabled={files.length === 0 || isPending || !user}>
        {isPending ? 'Uploading...' : 'Upload Files'}
      </Button>
    </form>
  );
} 