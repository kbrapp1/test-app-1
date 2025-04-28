'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export default function Error({ error, reset }: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service (e.g., Sentry, LogRocket)
        // In a real app, you'd integrate with a service here.
        console.error(error);
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