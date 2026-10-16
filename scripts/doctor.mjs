import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const major = Number(process.versions.node.split('.')[0]);
if (major < 22 || major >= 25) throw new Error('Use Node.js 22–24');
const required = [
  'AGENTS.md', 'package-lock.json', 'index.html', 'js/app.js',
  '.codex/setup.sh', '.codex/maintenance.sh', 'playwright.config.js',
  'docs/TZ_Elektrosmeta_HTML_CSS_JavaScript_Codex.md',
  'docs/PROMPT_CODEX_Elektrosmeta.txt', 'docs/IMPLEMENTATION_STATUS.md',
  'assets/fonts/DejaVuSans.ttf', 'assets/fonts/LICENSE.txt',
  'assets/vendor/jspdf.umd.min.js', 'assets/vendor/jspdf.plugin.autotable.min.js',
];
for (const item of required) await access(path.join(root, item));
const spec = await readFile(path.join(root, 'docs/TZ_Elektrosmeta_HTML_CSS_JavaScript_Codex.md'), 'utf8');
if (!spec.includes('C24') || !spec.includes('A25')) throw new Error('Specification incomplete');
console.log(`Environment OK: Node ${process.versions.node}; ${required.length} required paths. Run product tests to validate application behavior.`);
