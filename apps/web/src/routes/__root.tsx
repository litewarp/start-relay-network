/// <reference types="vite/client" />
import { HeadContent, Link, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Fragment, type ReactNode } from 'react';
import { DefaultCatchBoundary } from '#@/components/DefaultCatchBoundary.js';
import { NotFound } from '#@/components/NotFound.js';
import appCss from '#@/styles/app.css?url';
import { seo } from '#@/utils/seo.js';
import type { RelayRouterContext } from '@litewarp/start-relay-network';
import { ThemeProvider } from '@lonik/themer';

export const Route = createRootRouteWithContext<RelayRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      ...seo({
        title: 'TanStack Start | Type-Safe, Client-First, Full-Stack React Framework',
        description: `TanStack Start is a type-safe, client-first, full-stack React framework. `,
      }),
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      { rel: 'manifest', href: '/site.webmanifest', color: '#fffff' },
      { rel: 'icon', href: '/favicon.ico' },
    ],
    scripts: [],
  }),
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
  shellComponent: ShellComponent,
});

function ShellComponent(props: { children: ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {props.children}
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <Fragment>
      <ThemeProvider enableSystem>
        <nav className="flex items-center gap-6 border-b border-neutral-200 dark:border-neutral-800 px-6 py-3">
          <Link to="/" className="font-semibold text-neutral-900 dark:text-neutral-100">
            start-relay-network
          </Link>
          <Link
            to="/docs/what-it-does"
            className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
            activeOptions={{ includeSearch: false }}
            activeProps={{ className: 'text-sm text-neutral-900 dark:text-neutral-100 font-medium' }}
          >
            Docs
          </Link>
        </nav>
        <Outlet />
      </ThemeProvider>
    </Fragment>
  );
}
