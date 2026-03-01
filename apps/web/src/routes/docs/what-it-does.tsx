import { createFileRoute } from '@tanstack/react-router';
import Content from '#@/content/what-it-does.mdx';
import MdxLayout from '#@/components/MdxLayout.js';

export const Route = createFileRoute('/docs/what-it-does')({
  component: () => (
    <MdxLayout>
      <Content />
    </MdxLayout>
  ),
});
