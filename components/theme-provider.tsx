'use client'

import * as React                          from 'react'
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      {...props}
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"   // ← locks to dark, ignores system preference and user toggle
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}