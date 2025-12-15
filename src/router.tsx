import { createRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'

import { routeTree } from './routeTree.gen'
import RouteError from './components/route-error'
import RoutePending from './components/route-pending'

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })

export const createAppRouter = (queryClient: QueryClient) =>
  createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    context: {
      queryClient,
    },
    defaultErrorComponent: ({ error }) => <RouteError error={error} />,
    defaultPendingComponent: () => <RoutePending />,
    defaultPendingMs: 200,
    defaultPendingMinMs: 300,
  })

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
