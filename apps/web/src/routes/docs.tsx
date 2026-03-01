import { Link, Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/docs')({
  component: DocsLayout,
});

const navItems = [
  { to: '/docs/what-it-does', label: 'What it does' },
  { to: '/docs/how-to-use', label: 'How to use' },
  { to: '/docs/dev-setup', label: 'Dev setup' },
] as const;

function DocsLayout() {
  return (
    <div className="flex min-h-screen">
      <nav className="w-64 shrink-0 border-r border-neutral-200 dark:border-neutral-800 p-6">
        <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 mb-6 block">
          &larr; Home
        </Link>
        <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-4">
          Documentation
        </h2>
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="block px-3 py-2 rounded-md text-sm transition-colors"
                activeProps={{
                  className: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium',
                }}
                inactiveProps={{
                  className: 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100',
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <main className="flex-1 p-8 max-w-4xl">
        <Outlet />
      </main>
    </div>
  );
}
