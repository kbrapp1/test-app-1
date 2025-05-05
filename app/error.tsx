/**
 * Global Error Component
 * 
 * This component handles application-level errors that occur during rendering.
 * It displays a user-friendly error message and provides a way to recover.
 * 
 * Note: This is a Client Component as required by Next.js for error boundaries.
 */


'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export default function Error({ error, reset }: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Logging removed - External logging setup deferred
        // console.error(error);
    }, [error]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Oops! Something went wrong</CardTitle>
                    <CardDescription>
                        We encountered an unexpected error. Please try again.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Optionally display a simplified error message or code */}
                    {/* <p className="text-sm text-muted-foreground">Error Code: {error.digest || 'N/A'}</p> */}
                    <p className="text-sm text-destructive">Details: {error.message}</p>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button
                        onClick={
                            // Attempt to recover by trying to re-render the segment
                            () => reset()
                        }
                    >
                        Try Again
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
} 