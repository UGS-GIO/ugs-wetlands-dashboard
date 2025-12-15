import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/theme-provider'
import { Button } from './ui/button'
import { useEffect, useState } from 'react'

export default function ThemeSwitch() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Only render after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine the effective theme (for system preference)
  const getEffectiveTheme = () => {
    if (theme === 'system' && typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme
  }

  const effectiveTheme = getEffectiveTheme()

  // Render a placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <Button size="icon" variant="ghost" className="rounded-full">
        <Sun size={20} />
      </Button>
    )
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      className="rounded-full"
      onClick={() => setTheme(effectiveTheme === 'light' ? 'dark' : 'light')}
      title={`Switch to ${effectiveTheme === 'light' ? 'dark' : 'light'} mode`}
    >
      {effectiveTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
    </Button>
  )
}
