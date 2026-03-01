import { createFileRoute } from '@tanstack/react-router';
import Content from '#@/content/how-to-use.mdx';
import MdxLayout from '#@/components/MdxLayout.js';

export const Route = createFileRoute('/docs/how-to-use')({
  component: () => (
    <MdxLayout>
      <Content />
    </MdxLayout>
  ),
});
