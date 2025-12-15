import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import ThemeSwitch from './theme-switch'
import { Button } from './ui/button'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/water-chemistry', label: 'Water Chemistry' },
    { to: '/soil-chemistry', label: 'Soil Chemistry' },
    { to: '/macroinvertebrates', label: 'Macroinvertebrates' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border backdrop-blur-lg px-4 md:px-8 py-3">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 md:gap-4">
          <a href="https://geology.utah.gov/water/wetlands/" target="_blank" rel="noopener noreferrer">
            <img src={`${import.meta.env.BASE_URL}images/ugs_logo_large.png`} alt="UGS Logo" className="h-8 md:h-10" />
          </a>
          <div className="text-base md:text-xl font-bold">
            Utah Wetland Data Explorer
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-4">
          <nav className="flex gap-0">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block px-6 py-3 text-muted-foreground no-underline border-b-2 border-transparent transition-all duration-200 text-sm hover:text-primary hover:bg-primary/10"
                activeProps={{
                  className: "block px-6 py-3 text-primary no-underline border-b-2 border-primary transition-all duration-200 text-sm"
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <ThemeSwitch />
        </div>

        {/* Mobile Menu Button */}
        <div className="flex lg:hidden items-center gap-2">
          <ThemeSwitch />
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="lg:hidden mt-3 pb-2 border-t border-border pt-3">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block px-4 py-3 text-muted-foreground no-underline rounded-lg transition-all duration-200 text-sm hover:text-primary hover:bg-primary/10"
                activeProps={{
                  className: "block px-4 py-3 text-primary no-underline rounded-lg bg-primary/10 transition-all duration-200 text-sm"
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
