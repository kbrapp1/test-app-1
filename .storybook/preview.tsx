import type { Preview, Decorator } from '@storybook/react'
import React from 'react';
import { ThemeProvider } from "next-themes"

// Import global styles
import '../app/globals.css'

// Theme provider decorator
const withTheme: Decorator = (Story, context) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Story {...context} />
    </ThemeProvider>
  )
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
  decorators: [
    withTheme, // Add the theme decorator globally
  ],
}

export default preview; 