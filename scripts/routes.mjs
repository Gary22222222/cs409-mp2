import { mkdir, copyFile } from 'node:fs/promises';

// GitHub Pages has no SPA rewrites. Emit an entry for every supported route,
// so a pasted detail URL (or refresh) works without redirect scripts.
for (const route of ['gallery', 'list', ...Array.from({ length: 151 }, (_, i) => `pokemon/${i + 1}`)]) {
  await mkdir(`dist/${route}`, { recursive: true });
  await copyFile('dist/index.html', `dist/${route}/index.html`);
}
await copyFile('dist/index.html', 'dist/404.html');
