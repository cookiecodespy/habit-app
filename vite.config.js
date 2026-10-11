import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Visible in Ajustes so a deploy can be told apart at a glance: commit date + short hash.
// Derived from the commit (never from the wall clock) so the same commit builds the same bytes.
function appVersion() {
  const git = (args) => execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  try {
    return `${git('log -1 --format=%cd --date=format:%Y.%m.%d')} · ${git('rev-parse --short=7 HEAD')}`;
  } catch {
    const sha = process.env.WORKERS_CI_COMMIT_SHA || process.env.GITHUB_SHA;
    return sha ? sha.slice(0, 7) : 'local';
  }
}

// Writes dist/sw.js from src/sw.template.js with the list of files to keep for offline use.
// The cache name is a hash of the build output, so every deploy installs a fresh worker.
function serviceWorker(version) {
  let outDir = 'dist';
  return {
    name: 'lifeos-service-worker',
    apply: 'build',
    configResolved(config) { outDir = config.build.outDir; },
    closeBundle() {
      const walk = (dir) => readdirSync(dir).flatMap((name) => {
        const full = join(dir, name);
        return statSync(full).isDirectory() ? walk(full) : [full];
      });
      const skip = new Set(['sw.js', '_headers', 'index.html']);
      const files = walk(outDir)
        .map((full) => relative(outDir, full).split(sep).join('/'))
        .filter((file) => !skip.has(file))
        .sort();
      const hash = createHash('sha256');
      for (const file of ['index.html', ...files]) hash.update(file).update(readFileSync(join(outDir, file)));
      const template = readFileSync('src/sw.template.js', 'utf8');
      const precache = ['/', ...files.map((file) => `/${file}`)];
      writeFileSync(
        join(outDir, 'sw.js'),
        template
          .replace('__BUILD_ID__', hash.digest('hex').slice(0, 12))
          .replace('__APP_VERSION__', version)
          .replace('__PRECACHE__', JSON.stringify(precache, null, 2)),
      );
    },
  };
}

const version = appVersion();

export default defineConfig({
  plugins: [react(), serviceWorker(version)],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  build: {
    outDir: 'dist',
    target: 'es2022',
    rollupOptions: {
      output: {
        // React changes rarely: keeping it apart lets returning visitors reuse it across deploys.
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
          return undefined;
        },
      },
    },
  },
  test: {
    include: ['tests/unit/**/*.test.{ts,js}'],
    environment: 'node',
    // Dates are local-time strings: pin the zone so results do not depend on the machine.
    env: { TZ: 'America/Santiago' },
  },
});
