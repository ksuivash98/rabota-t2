import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
const html = await readFile(new URL('index.html', output), 'utf8');
if (!html.includes('/rabota-t2/assets/') || html.includes('/src/main.js')) {
  throw new Error('Expected a compiled GitHub Pages build with the repository base path.');
}
// Only generated, explicitly owned paths are replaced; source and user files stay intact.
await rm(new URL('assets/', root), { recursive: true, force: true });
await mkdir(new URL('assets/', root), { recursive: true });
await cp(new URL('assets/', output), new URL('assets/', root), { recursive: true });
for (const name of ['index.html', 'favicon.svg', 'inter-OFL.txt']) {
  await cp(new URL(name, output), new URL(name, root));
}
await writeFile(new URL('.nojekyll', root), '');
console.log(`GitHub Pages build saved to ${fileURLToPath(root)}`);
