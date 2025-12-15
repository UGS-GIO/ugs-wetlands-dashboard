export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-card px-4 md:px-8 py-3 text-center text-sm text-muted-foreground">
      © {currentYear}{' '}
      <a
        href="https://geology.utah.gov/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        Utah Geological Survey
      </a>
      {' | '}
      <a
        href="https://geology.utah.gov/water/wetlands/"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-primary"
      >
        Wetlands Program
      </a>
      {' | '}
      Contact:{' '}
      <a
        href="mailto:beckad@utah.gov"
        className="text-primary hover:underline"
      >
        beckad@utah.gov
      </a>
    </footer>
  )
}
