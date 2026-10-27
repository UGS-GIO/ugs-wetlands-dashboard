import { createContext, useContext, useState } from 'react'

const THEMES = ['dark', 'light', 'system'] as const

type Theme = (typeof THEMES)[number]

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

// Sync the theme class on <html>; called when the theme is chosen, not after render
function applyTheme(theme: Theme) {
  const root = window.document.documentElement
  root.classList.remove('light', 'dark')

  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    root.classList.add(systemTheme)
    return
  }

  root.classList.add(theme)
}

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  storageKey = 'wetlands-ui-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const initialTheme = THEMES.find((t) => t === localStorage.getItem(storageKey)) ?? defaultTheme
    applyTheme(initialTheme)
    return initialTheme
  })

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme)
      applyTheme(newTheme)
      setThemeState(newTheme)
    },
  }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
