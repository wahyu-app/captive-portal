import { cp, mkdir, rm } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const output = new URL('../dist/', import.meta.url);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const entry of ['index.html', 'main.js', 'assets']) {
  await cp(new URL(entry, root), new URL(entry, output), { recursive: true });
}

console.log('Static site written to dist/.');
