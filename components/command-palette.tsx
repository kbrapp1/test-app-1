"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Settings,
  Sun,
  Moon,
  Laptop,
  UploadCloudIcon,
} from "lucide-react"
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

import { DialogTitle, DialogDescription } from "@/components/ui/dialog"

// Define props interface
interface CommandPaletteProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function CommandPalette({ open, setOpen }: CommandPaletteProps) {
  const router = useRouter()
  const { setTheme } = useTheme()

  // Re-introduce helper function using setTimeout
  const runCommand = React.useCallback((command: () => unknown) => {
    command(); // Run command first
    setTimeout(() => {
      setOpen(false);
    }, 0);
  }, [setOpen]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <DialogTitle className="sr-only">Command Palette</DialogTitle>
      <DialogDescription className="sr-only">
        Search for commands, navigate the app, or change settings.
      </DialogDescription>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Navigation Commands */}
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => router.push('/dashboard'))}
            value="Go to Dashboard"
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Documents Commands */}
        <CommandGroup heading="Documents">
          <CommandItem
            onSelect={() => runCommand(() => router.push('/documents/notes'))}
            value="Go to Notes Document Section"
          >
            <span className="mr-2 h-4 w-4">📝</span>
            <span>Notes</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/dam/upload'))}
            value="Go to Asset Library Upload DAM"
          >
            <UploadCloudIcon className="mr-2 h-4 w-4" />
            <span>Asset Library</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Settings Commands */}
        <CommandGroup heading="Settings">
          <CommandItem
            onSelect={() => runCommand(() => router.push('/settings/profile'))}
            value="Go to Settings Profile"
          >
             <Settings className="mr-2 h-4 w-4" />
             <span>Profile</span>
          </CommandItem>
           <CommandItem
            onSelect={() => runCommand(() => router.push('/settings/password'))}
            value="Go to Settings Password"
          >
             <span className="mr-2 h-4 w-4">🔑</span>
             <span>Password</span>
          </CommandItem>
           <CommandItem
            onSelect={() => runCommand(() => router.push('/settings/email'))}
            value="Go to Settings Email"
          >
             <span className="mr-2 h-4 w-4">✉️</span>
             <span>Email</span>
          </CommandItem>
           <CommandItem
            onSelect={() => runCommand(() => router.push('/settings/security'))}
            value="Go to Settings Security"
          >
             <span className="mr-2 h-4 w-4">🛡️</span>
             <span>Security</span>
          </CommandItem>
           <CommandItem
            onSelect={() => runCommand(() => router.push('/settings/danger'))}
            value="Go to Settings Danger Zone"
          >
             <span className="mr-2 h-4 w-4">⚠️</span>
             <span>Danger Zone</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Development Commands */}
        <CommandGroup heading="Development">
          <CommandItem
            onSelect={() => runCommand(() => window.open('http://localhost:6006', '_blank'))}
            value="Open Storybook"
          >
            <span className="mr-2 h-4 w-4">📖</span>
            <span>Storybook</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Theme Commands - Explicitly close */}
        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
            <Sun className="mr-2 h-4 w-4" />
            Light
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
            <Moon className="mr-2 h-4 w-4" />
            Dark
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
            <Laptop className="mr-2 h-4 w-4" />
            System
          </CommandItem>
        </CommandGroup>

      </CommandList>
    </CommandDialog>
  )
} 