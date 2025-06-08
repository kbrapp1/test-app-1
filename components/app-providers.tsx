"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "@/components/theme-provider";
import { CommandPalette } from "@/components/command-palette";
import { PaletteProvider } from "@/context/palette-context";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as RadixToaster } from "@/components/ui/toaster";
import { PerformanceMonitorProvider, usePerformanceMonitor } from "@/lib/monitoring/presentation/providers/performance-analysis/PerformanceMonitorProvider";
import { ClientOnlyPerformanceMonitor } from "@/lib/monitoring/presentation/components/performance-analysis/ClientOnlyPerformanceMonitor";

// Separate component to use the hook
function PerformanceMonitorWrapper() {
  const { isEnabled } = usePerformanceMonitor();

  return <ClientOnlyPerformanceMonitor isEnabled={isEnabled} />;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  // Create QueryClient instance with optimized defaults
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
        gcTime: 10 * 60 * 1000, // 10 minutes - cache time
        retry: 3, // Retry failed requests 3 times
        refetchOnWindowFocus: false, // Don't refetch on window focus
        refetchOnReconnect: true, // Refetch when reconnecting
      },
      mutations: {
        retry: 1, // Retry mutations once
      },
    },
  }));

  const paletteContextValue = React.useMemo(() => ({
    setOpen: setPaletteOpen,
  }), [setPaletteOpen]);

  return (
    <QueryClientProvider client={queryClient}>
      <PerformanceMonitorProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          themes={['light', 'dark', 'system', 'ironmark']}
        >
          <TooltipProvider delayDuration={50}>
            <PaletteProvider value={paletteContextValue}>
              {children}
              <SonnerToaster position="bottom-right" richColors />
              <RadixToaster />
            </PaletteProvider>
            <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} />
          </TooltipProvider>
        </ThemeProvider>
        
        <ReactQueryDevtools initialIsOpen={false} />
        
        {/* Global Performance Monitor - Development Only */}
        <PerformanceMonitorWrapper />
      </PerformanceMonitorProvider>
    </QueryClientProvider>
  );
} 