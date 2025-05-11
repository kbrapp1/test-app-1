"use client";

import * as React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { CommandPalette } from "@/components/command-palette";
import { PaletteProvider } from "@/context/palette-context";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as RadixToaster } from "@/components/ui/toaster";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  const paletteContextValue = React.useMemo(() => ({
    setOpen: setPaletteOpen,
  }), [setPaletteOpen]);

  return (
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
  );
} 