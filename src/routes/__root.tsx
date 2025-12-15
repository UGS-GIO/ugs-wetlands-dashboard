import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import Header from '../components/header'
import Footer from '../components/footer'
import { ThemeProvider } from '../context/theme-provider'

import appCss from '../styles.css?url'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Utah Wetland Data Explorer',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        href: '/favicon.ico',
        type: 'image/png',
      },
      {
        rel: 'stylesheet',
        href: 'https://unpkg.com/maplibre-gl@5.0.0/dist/maplibre-gl.css',
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { queryClient } = Route.useRouteContext()

  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="flex flex-col min-h-screen">
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="dark" storageKey="wetlands-ui-theme">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </ThemeProvider>
          <ReactQueryDevtools buttonPosition="bottom-left" />
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}
