import { createRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Import default error and pending components
import RouteError from './components/route-error'
import RoutePending from './components/route-pending'

// Create a QueryClient with sensible defaults for wetland data
export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Data doesn't change frequently, so 5 minutes is reasonable
        staleTime: 5 * 60 * 1000,
        // Keep in cache for 30 minutes
        gcTime: 30 * 60 * 1000,
        // Retry failed requests once
        retry: 1,
        // Don't refetch on window focus for this data-heavy app
        refetchOnWindowFocus: false,
      },
    },
  })

// Create a new router instance
export const getRouter = () => {
  const queryClient = createQueryClient()

  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    context: {
      queryClient,
    },
    defaultErrorComponent: ({ error }) => <RouteError error={error} />,
    defaultPendingComponent: () => <RoutePending />,
    defaultPendingMs: 200, // Show pending UI after 200ms to avoid flash
    defaultPendingMinMs: 300, // Show for at least 300ms to avoid jarring transitions
  })

  return router
}

// Type for router context
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
