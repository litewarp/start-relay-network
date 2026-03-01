import { createFileRoute } from '@tanstack/react-router';
import Content from '#@/content/dev-setup.mdx';
import MdxLayout from '#@/components/MdxLayout.js';

export const Route = createFileRoute('/docs/dev-setup')({
  component: () => (
    <MdxLayout>
      <Content />
    </MdxLayout>
  ),
});
