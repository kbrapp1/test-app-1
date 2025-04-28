import type { Metadata } from 'next'
import './globals.css'
import { AppProviders } from "@/components/app-providers"
// Toaster now rendered by AppProviders
// import { Toaster } from "@/components/ui/toaster"

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
        <AppProviders>{children}</AppProviders>
        {/* <Toaster /> */}{/* Removed as it's now in AppProviders */}
      </body>
    </html>
  )
}
