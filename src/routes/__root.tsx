import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
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
  return (
    <ThemeProvider defaultTheme="dark" storageKey="wetlands-ui-theme">
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
      <TanStackRouterDevtools position="bottom-right" />
    </ThemeProvider>
  )
}
