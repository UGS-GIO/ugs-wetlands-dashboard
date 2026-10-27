import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/theme-provider'
import { Button } from './ui/button'

export default function ThemeSwitch() {
  const { theme, setTheme } = useTheme()

  // Determine the effective theme (for system preference)
  const getEffectiveTheme = () => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme
  }

  const effectiveTheme = getEffectiveTheme()

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
