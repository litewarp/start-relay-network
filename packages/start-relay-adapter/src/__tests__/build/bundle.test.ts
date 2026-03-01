import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const pkgRoot = resolve(import.meta.dirname, '../../..');
const distFile = resolve(pkgRoot, 'dist/index.mjs');

describe('bundle output', () => {
  beforeAll(() => {
    execSync('bun run build', { cwd: pkgRoot, stdio: 'pipe' });
  }, 60_000);

  it('does not contain the debug package', () => {
    const dist = readFileSync(distFile, 'utf-8');

    // debug package should not be imported or bundled
    expect(dist).not.toMatch(/^import debug from ['"]debug['"]/m);
    expect(dist).not.toContain('createDebug');
    expect(dist).not.toContain('localStorageDebug');
    expect(dist).not.toContain('useColors');
  });
});
