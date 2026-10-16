import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const target = path.join(root, 'assets/vendor');
await mkdir(target, { recursive: true });
const sources = [
  ['jspdf', 'dist/jspdf.umd.min.js', 'jspdf.umd.min.js'],
  ['jspdf-autotable', 'dist/jspdf.plugin.autotable.min.js', 'jspdf.plugin.autotable.min.js'],
];
const manifest = [];
for (const [name, relative, filename] of sources) {
  const base = path.join(root, 'node_modules', name);
  const pkg = JSON.parse(await readFile(path.join(base, 'package.json'), 'utf8'));
  const content = await readFile(path.join(base, relative));
  await copyFile(path.join(base, relative), path.join(target, filename));
  let copiedLicense = false;
  for (const candidate of ['LICENSE', 'LICENSE.txt', 'LICENSE.md']) {
    try { await copyFile(path.join(base, candidate), path.join(target, `${name}-LICENSE.txt`)); copiedLicense = true; break; }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  if (!copiedLicense) throw new Error(`License missing for ${name}`);
  manifest.push({ name, version: pkg.version, license: pkg.license, source: `https://registry.npmjs.org/${name}/-/${name}-${pkg.version}.tgz`, file: filename, sha256: createHash('sha256').update(content).digest('hex') });
}
await writeFile(path.join(target, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('Prepared local PDF dependencies and licenses.');
