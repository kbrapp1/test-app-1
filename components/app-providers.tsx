"use client";

import * as React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { CommandPalette } from "@/components/command-palette";
import { PaletteProvider } from "@/context/palette-context";

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
    >
      <PaletteProvider value={paletteContextValue}>
        {children}
      </PaletteProvider>
      <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} />
    </ThemeProvider>
  );
} 