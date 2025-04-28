"use client"

import React, { createContext, useContext } from 'react';

interface PaletteContextType {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const PaletteContext = createContext<PaletteContextType | undefined>(undefined);

export const usePalette = () => {
  const context = useContext(PaletteContext);
  if (context === undefined) {
    // Provide a default no-op function if context is not available
    console.warn("usePalette must be used within a PaletteProvider - providing default no-op function");
    return { setOpen: () => {} }; 
  }
  return context;
};

export const PaletteProvider = PaletteContext.Provider; 