import type { ReactNode } from 'react';

export default function MdxLayout({ children }: { children: ReactNode }) {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      {children}
    </article>
  );
}
