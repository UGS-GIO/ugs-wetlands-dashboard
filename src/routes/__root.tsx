import { createRootRouteWithContext, Outlet, useRouterState } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { QueryClient } from '@tanstack/react-query'

import Header from '../components/header'
import Footer from '../components/footer'
import { ThemeProvider } from '../context/theme-provider'

import '../styles.css'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isMapRoute = pathname.startsWith('/wetlands-map')

  return (
    <ThemeProvider defaultTheme="dark" storageKey="wetlands-ui-theme">
      <div className={`flex flex-col ${isMapRoute ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
        <Header />
        <main className={`flex-1 ${isMapRoute ? 'min-h-0' : ''}`}>
          <Outlet />
        </main>
        {!isMapRoute && <Footer />}
      </div>
      <TanStackRouterDevtools position="bottom-right" />
    </ThemeProvider>
  )
}
