import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:net';
import { readFileSync, mkdirSync, rmSync, writeFileSync, createWriteStream } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateUnitReport, validateBrowserReport, validateBuild } from './verify-results.mjs';
import { captureSource, assertSource } from './verification-source.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const args = process.argv.slice(2);
if (args.some(arg => arg !== '--headed')) throw new Error('Only --headed is supported; verify always runs all checks');
const reports = join(root, '.verification');
rmSync(reports, { recursive: true, force: true });
mkdirSync(reports);
const manifest = JSON.parse(readFileSync(join(root, 'scripts/required-verification.json'), 'utf8'));
const ci = Boolean(process.env.CI && !['false', '0'].includes(process.env.CI)) || process.env.GITHUB_ACTIONS === 'true';
const summary = { head: execFileSync('git', ['--no-replace-objects', 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), startedAt: new Date().toISOString(), steps: [], success: false };
let source;
async function run(name, command, arguments_, env = {}) {
  assertSource(source, root, ci);
  console.log(`\nVERIFY: ${name}`);
  const log = createWriteStream(join(reports, `${name}.log`));
  await new Promise((resolve, reject) => {
    const child = spawn(command, arguments_, { cwd: root, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
    for (const [stream, output] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
      stream.on('data', data => { log.write(data); output.write(data); });
    }
    child.on('error', error => { log.end(); reject(error); });
    child.on('close', (code, signal) => {
      log.end(); summary.steps.push({ name, command, arguments: arguments_, exitCode: code, signal });
      code === 0 ? resolve() : reject(new Error(`${name} failed: exit ${code}, signal ${signal}`));
    });
  });
  assertSource(source, root, ci);
}
async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}
try {
  source = captureSource(root, ci);
  if (ci) {
    if (!process.env.DEMP_VERIFY_SOURCE_SNAPSHOT) throw new Error('CI requires a pre-install source snapshot captured before install');
    source = JSON.parse(readFileSync(process.env.DEMP_VERIFY_SOURCE_SNAPSHOT, 'utf8'));
    assertSource(source, root, true);
  }
  summary.sourceSha256 = source.sourceSha256;
  summary.sourceBaseline = ci ? 'pre-install-git' : 'local-working-tree';
  await run('contracts', 'npm', ['run', 'check:agent-contracts', '--', '--probe-violation']);
  await run('types', 'npm', ['run', 'typecheck']);
  await run('unit', 'npm', ['test', '--', '--reporter=default', '--reporter=json', '--outputFile=.verification/unit.json']);
  summary.unit = validateUnitReport(JSON.parse(readFileSync(join(reports, 'unit.json'), 'utf8')), manifest, root);
  await run('lint', 'npm', ['run', 'lint', '--', '--no-fix']);
  await run('build', 'npm', ['run', 'build']);
  summary.build = validateBuild(join(root, 'dist'));
  summary.browserPort = await freePort();
  do { summary.devBrowserPort = await freePort(); } while (summary.devBrowserPort === summary.browserPort);
  await run('browser', 'npm', ['run', 'test:e2e', '--', ...args], { DEMP_E2E_PORT: String(summary.browserPort), DEMP_DEV_E2E_PORT: String(summary.devBrowserPort) });
  summary.browser = validateBrowserReport(JSON.parse(readFileSync(join(reports, 'e2e.json'), 'utf8')), manifest);
  assertSource(source, root, ci);
  if (summary.build.sha256 !== validateBuild(join(root, 'dist')).sha256) throw new Error('Build changed during verification');
  summary.success = true;
  console.log(`\nPASS: ${summary.unit.passed} unit assertions, ${summary.browser.passed} browser flows; production build ${summary.build.sha256}`);
} catch (error) {
  summary.error = error.message; process.exitCode = 1; console.error(error);
} finally {
  summary.finishedAt = new Date().toISOString();
  writeFileSync(join(reports, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
}
