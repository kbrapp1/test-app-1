/**
 * Root Layout Component
 * 
 * This is the main layout component that wraps the entire application.
 * It provides:
 * - Global styles through globals.css
 * - Application providers for context and state management
 * - Error boundary for graceful error handling
 * - Basic HTML structure with language settings
 * 
 * All pages in the application will be rendered within this layout.
 */

import type { Metadata } from 'next'
import './globals.css'
import { AppProviders } from "@/components/app-providers"
import { ErrorBoundary } from "@/components/error/error-boundary";

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ErrorBoundary>
          <AppProviders>{children}</AppProviders>
        </ErrorBoundary>
      </body>
    </html>
  )
}
