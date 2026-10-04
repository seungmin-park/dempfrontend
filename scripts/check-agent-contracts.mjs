import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { inspectSourceBoundaries } from './source-boundaries.mjs';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const docsArgument = process.argv.indexOf('--docs-json');
const docsPath = docsArgument >= 0 ? process.argv[docsArgument + 1] : join(root, 'docs/engineering/official-docs.json');
if (!docsPath) throw new Error('--docs-json requires a path');
const data = JSON.parse(readFileSync(docsPath, 'utf8'));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
const tools = readFileSync(join(root, '.tool-versions'), 'utf8');
const names = { 'Node.js': 'nodejs', Vue: 'vue', 'Vue Router': 'vue-router', Vuex: 'vuex', TypeScript: 'typescript', Vite: 'vite', Vitest: 'vitest', Playwright: '@playwright/test', 'Tiptap Vue': '@tiptap/vue-3' };
if (data.entries.length !== Object.keys(names).length) throw new Error('Official documentation entries changed');
for (const entry of data.entries) {
  const key = names[entry.name];
  if (!key) throw new Error(`Unexpected documentation entry: ${entry.name}`);
  const version = key === 'nodejs' ? tools.match(/^nodejs\s+(\S+)/m)?.[1] : pkg.dependencies?.[key] ?? pkg.devDependencies?.[key];
  if (version !== entry.version) throw new Error(`${entry.name}: manifest ${version}, official-docs ${entry.version}`);
  if (key !== 'nodejs' && lock.packages?.['node_modules/' + key]?.version !== version) throw new Error(`${entry.name}: package-lock does not match ${version}`);
  if (!entry.url.startsWith('https://')) throw new Error(`${entry.name}: missing official URL`);
}
const scanArgument = process.argv.indexOf('--scan-root');
const scanRoot = scanArgument >= 0 ? process.argv[scanArgument + 1] : root;
if (!scanRoot) throw new Error('--scan-root requires a path');
const failures = inspectSourceBoundaries(scanRoot);
if (failures.length) throw new Error(failures.join('\n'));
if (process.argv.includes('--probe-violation')) {
  const temp = mkdtempSync(join(tmpdir(), 'demp-guard-'));
  try {
    const path = join(temp, 'src/components/RogueReaction.vue');
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `<script>import { setReaction } from '@/api/reactions'; setReaction('question', 1, 'RECOMMEND');</script>`);
    const detected = inspectSourceBoundaries(temp);
    if (detected.length !== 1) throw new Error(`Guard failed to reject violation: ${detected}`);
    console.log('PASS: temporary direct API call rejected:', detected[0]);
  } finally { rmSync(temp, { recursive: true, force: true }); }
}
console.log('PASS: official docs match package/tool versions and components delegate reaction writes');
