import { useRouter } from '@tanstack/react-router'
import { Button } from './ui/button'

interface RouteErrorProps {
  error: Error
  reset?: () => void
}

export default function RouteError({ error, reset }: RouteErrorProps) {
  const router = useRouter()

  const handleRetry = () => {
    if (reset) {
      reset()
    } else {
      router.invalidate()
    }
  }

  return (
    <div className="px-4 md:px-8 pt-8">
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-xl p-8 text-center">
        <div className="mb-6">
          <svg
            className="w-16 h-16 mx-auto text-destructive"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>

        <p className="text-muted-foreground mb-4">
          We encountered an error while loading this page. This could be due to a network issue or a problem with the data service.
        </p>

        {error.message && (
          <div className="bg-muted rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-mono text-muted-foreground break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => router.history.back()}>
            Go Back
          </Button>
          <Button onClick={handleRetry}>
            Try Again
          </Button>
        </div>
      </div>
    </div>
  )
}
