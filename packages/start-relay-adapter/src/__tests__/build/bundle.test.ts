import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const pkgRoot = resolve(import.meta.dirname, '../../..');
// Build into a scratch directory rather than the real dist/, which other
// tasks (the web app's typecheck and build) read concurrently.
const outDir = mkdtempSync(join(tmpdir(), 'start-relay-bundle-'));
const distFile = join(outDir, 'index.mjs');

describe('bundle output', () => {
  beforeAll(() => {
    execSync(`bun run tsdown --out-dir ${outDir}`, { cwd: pkgRoot, stdio: 'pipe' });
  }, 60_000);

  afterAll(() => {
    rmSync(outDir, { recursive: true, force: true });
  });

  it('does not contain the debug package', () => {
    const dist = readFileSync(distFile, 'utf-8');

    // debug package should not be imported or bundled
    expect(dist).not.toMatch(/^import debug from ['"]debug['"]/m);
    expect(dist).not.toContain('createDebug');
    expect(dist).not.toContain('localStorageDebug');
    expect(dist).not.toContain('useColors');
  });
});
