// @vitest-environment node
import { afterEach, expect, test } from 'vitest';
import { chmodSync, cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = join(dirname(fileURLToPath(import.meta.url)), '../..');
const repositories = [];
afterEach(() => repositories.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));

function repository() {
  const root = mkdtempSync(join(tmpdir(), 'demp-verification-source-'));
  repositories.push(root);
  mkdirSync(join(root, 'scripts'));
  mkdirSync(join(root, 'public'));
  // Exercise the real coordinator and validators; only its child project commands are fixtures.
  cpSync(join(project, 'scripts'), join(root, 'scripts'), { recursive: true });
  const manifest = { unitFiles: ['tests/unit/example.spec.js'], unitAssertions: [{ file: 'tests/unit/example.spec.js', title: '실제 결과' }], e2eTests: [{ file: 'example.spec.js', title: '화면 결과' }] };
  writeFileSync(join(root, 'scripts/required-verification.json'), JSON.stringify(manifest));
  writeFileSync(join(root, '.gitignore'), 'dist/\n.verification/\n.env.local\n.env.*.local\n');
  writeFileSync(join(root, 'index.html'), '<div id="app"></div>');
  writeFileSync(join(root, 'public/asset.txt'), 'original public asset');
  writeFileSync(join(root, 'server.cjs'), 'module.exports = "original server";');
  writeFileSync(join(root, 'fixture-stage.cjs'), `
const { mkdirSync, writeFileSync } = require('node:fs');
const stage = process.argv[2];
if (stage === 'unit') {
  if (process.env.MUTATE_FILE) writeFileSync(process.env.MUTATE_FILE, 'changed during unit verification');
  writeFileSync('.verification/unit.json', JSON.stringify({ success: true, numTotalTestSuites: 1, numPassedTestSuites: 1, numFailedTestSuites: 0, numPendingTestSuites: 0, numTotalTests: 1, numPassedTests: 1, numFailedTests: 0, numPendingTests: 0, numTodoTests: 0, testResults: [{ name: 'tests/unit/example.spec.js', status: 'passed', assertionResults: [{ fullName: '실제 결과', status: 'passed' }] }] }));
}
if (stage === 'build') {
  mkdirSync('dist/assets', { recursive: true });
  writeFileSync('dist/index.html', '<script src="/assets/app.js"></script><link rel="stylesheet" href="/assets/app.css">');
  writeFileSync('dist/assets/app.js', 'console.log("built")');
  writeFileSync('dist/assets/app.css', 'body{margin:0}');
}
if (stage === 'browser') writeFileSync('.verification/e2e.json', JSON.stringify({ errors: [], stats: { expected: 1, unexpected: 0, skipped: 0, flaky: 0 }, suites: [{ specs: [{ file: 'example.spec.js', title: '화면 결과', ok: true, tests: [{ expectedStatus: 'passed', status: 'expected', results: [{ status: 'passed', retry: 0 }] }] }] }] }));
`);
  const commands = { 'check:agent-contracts': 'contracts', typecheck: 'types', test: 'unit', lint: 'lint', build: 'build', 'test:e2e': 'browser' };
  writeFileSync(join(root, 'package.json'), JSON.stringify({ scripts: Object.fromEntries(Object.entries(commands).map(([name, stage]) => [name, `node fixture-stage.cjs ${stage}`])) }));
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['add', '.'], { cwd: root });
  execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'fixture'], { cwd: root });
  return root;
}

function verify(root, env = {}) {
  return spawnSync(process.execPath, ['scripts/verify.mjs'], {
    cwd: root, encoding: 'utf8', timeout: 15000,
    env: { ...process.env, CI: '', GITHUB_ACTIONS: '', DEMP_VERIFY_SOURCE_SNAPSHOT: '', ...env },
  });
}

function beforeInstallSnapshot(root) {
  const directory = mkdtempSync(join(tmpdir(), 'demp-before-install-'));
  repositories.push(directory);
  // The fixture's committed files are the independent pre-install input, before any mutation.
  const files = execFileSync('git', ['ls-tree', '-r', '--name-only', '-z', 'HEAD'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean).sort();
  const hash = createHash('sha256');
  for (const file of files) hash.update(file).update('\0').update(execFileSync('git', ['show', `HEAD:${file}`], { cwd: root })).update('\0');
  const snapshot = join(directory, 'source.json');
  writeFileSync(snapshot, JSON.stringify({ version: 1, head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), sourceSha256: hash.digest('hex') }));
  return snapshot;
}

test('변경 없는 Git 입력과 실제 단계 보고서는 검증을 통과한다', () => {
  const root = repository();
  const result = verify(root);
  expect(result.stderr).not.toMatch(/Error/);
  expect(result.status).toBe(0);
  expect(JSON.parse(readFileSync(join(root, '.verification/summary.json'), 'utf8')).success).toBe(true);
});

test('미커밋 입력과 기존 ignored 환경 파일의 로컬 검증은 작업 트리 기준으로 기록한다', () => {
  const root = repository();
  writeFileSync(join(root, 'index.html'), 'local in-progress edit');
  writeFileSync(join(root, '.env.production.local'), 'VITE_API_URL=/api');
  const result = verify(root);
  expect(result.status).toBe(0);
  expect(JSON.parse(readFileSync(join(root, '.verification/summary.json'), 'utf8')).sourceBaseline).toBe('local-working-tree');
});

test('시작 전에 있던 ignored 환경 파일도 단계 중 바뀌면 거절한다', () => {
  const root = repository();
  writeFileSync(join(root, '.env.production.local'), 'VITE_API_URL=/api');
  const result = verify(root, { MUTATE_FILE: '.env.production.local' });
  expect(result.status).toBe(1);
  expect(result.stdout).not.toContain('VERIFY: build');
});

test.each(['index.html', 'public/asset.txt', 'server.cjs', '.env.production.local'])('검증 중 %s 입력 변경은 성공 증거 생성을 거부한다', file => {
  const root = repository();
  const result = verify(root, { MUTATE_FILE: file });
  expect(result.status).toBe(1);
  const summary = JSON.parse(readFileSync(join(root, '.verification/summary.json'), 'utf8'));
  expect(summary.success).toBe(false);
  expect(summary.error).toMatch(/Source|input/i);
});

test('CI는 설치 전 입력 기준 없이 성공 보고서를 만들지 않는다', () => {
  const root = repository();
  const result = verify(root, { CI: 'true', DEMP_VERIFY_SOURCE_SNAPSHOT: '' });
  expect(result.status).toBe(1);
  expect(result.stdout).not.toContain('VERIFY: contracts');
  expect(result.stderr).toMatch(/before install|pre-install/i);
});

test('CI의 로컬 환경 파일은 프로젝트 명령을 실행하기 전에 거절한다', () => {
  const root = repository();
  writeFileSync(join(root, '.env.production.local'), 'VITE_API_URL=https://foreign.example');
  const result = verify(root, { CI: 'true' });
  expect(result.status).toBe(1);
  expect(result.stdout).not.toContain('VERIFY: contracts');
  expect(result.stderr).toMatch(/local environment/i);
});

test('입력 변조 뒤에는 후속 빌드 명령을 실행하지 않는다', () => {
  const root = repository();
  const result = verify(root, { MUTATE_FILE: 'index.html' });
  expect(result.status).toBe(1);
  expect(result.stdout).not.toContain('VERIFY: build');
});

test('CI의 변경 없는 설치 전 기준은 전체 단계의 성공을 허용한다', () => {
  const root = repository();
  const result = verify(root, { CI: 'true', DEMP_VERIFY_SOURCE_SNAPSHOT: beforeInstallSnapshot(root) });
  expect(result.status).toBe(0);
});

test('설치 중 바뀐 입력은 verifier 시작 시 새 기준으로 받아들이지 않는다', () => {
  const root = repository();
  const snapshot = beforeInstallSnapshot(root);
  writeFileSync(join(root, 'index.html'), 'changed by install');
  const result = verify(root, { CI: 'true', DEMP_VERIFY_SOURCE_SNAPSHOT: snapshot });
  expect(result.status).toBe(1);
  expect(result.stdout).not.toContain('VERIFY: contracts');
  expect(result.stderr).toMatch(/Source input changed/i);
});

test('체크아웃 밖에 복사한 CI 검사기도 설치 전 입력과 설치 후 변조를 검증한다', () => {
  const root = repository();
  const directory = mkdtempSync(join(tmpdir(), 'demp-ci-input-guard-'));
  repositories.push(directory);
  const guard = join(directory, 'guard.mjs');
  const snapshot = join(directory, 'source.json');
  cpSync(join(root, 'scripts/verification-source.mjs'), guard);
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const run = command => spawnSync(process.execPath, [guard, command, root, snapshot, head], { encoding: 'utf8' });
  const captured = run('capture');
  expect(captured.stderr).toBe('');
  expect(captured.status).toBe(0);
  expect(captured.stdout).toContain(`PASS: source input ${head}`);
  expect(JSON.parse(readFileSync(snapshot, 'utf8')).head).toBe(head);
  expect(run('check').status).toBe(0);
  writeFileSync(join(root, 'public/asset.txt'), 'installed replacement');
  const checked = run('check');
  expect(checked.status).toBe(1);
  expect(checked.stderr).toMatch(/Source input changed/);
});

function workflowCommands(head) {
  const workflow = readFileSync(join(project, '.github/workflows/ci.yml'), 'utf8');
  const explicitBash = /^defaults:\n {2}run:\n {4}shell: bash$/m.test(workflow);
  expect(workflow.match(/^\s+shell:/gm)?.length ?? 0).toBe(explicitBash ? 1 : 0);
  // GitHub's unspecified default is bash -e, while explicit bash also sets pipefail.
  const shell = explicitBash ? ['--noprofile', '--norc', '-eo', 'pipefail', '-c'] : ['-e', '-c'];
  const commands = [...workflow.matchAll(/^ {8}run: \|\n((?: {10}.*\n)+)/gm)]
    .map(match => match[1].replace(/^ {10}/gm, '').replaceAll('${{ github.sha }}', head));
  expect(commands.length).toBeGreaterThanOrEqual(2);
  return { shell, commands };
}

test.each([
  ['외부 검사기 교체', `writeFileSync('public/asset.txt', 'installed replacement'); writeFileSync(process.env.RUNNER_TEMP + '/demp-verification-source.mjs', 'process.exit(0);');`],
  ['Git index 플래그와 기준 파일 교체', `execFileSync('git', ['update-index', '--assume-unchanged', 'public/asset.txt']); writeFileSync('public/asset.txt', 'installed replacement'); const {captureSource} = await import(pathToFileURL(resolve('scripts/verification-source.mjs'))); writeFileSync(process.env.DEMP_VERIFY_SOURCE_SNAPSHOT, JSON.stringify(captureSource(process.cwd())));`],
  ['Git 자산 replacement ref', `const original = execFileSync('git', ['rev-parse', 'HEAD:public/asset.txt'], {encoding:'utf8'}).trim(); writeFileSync('public/asset.txt', 'installed replacement'); const replacement = execFileSync('git', ['hash-object', '-w', 'public/asset.txt'], {encoding:'utf8'}).trim(); execFileSync('git', ['replace', original, replacement]); const {captureSource} = await import(pathToFileURL(resolve('scripts/verification-source.mjs'))); writeFileSync(process.env.DEMP_VERIFY_SOURCE_SNAPSHOT, JSON.stringify(captureSource(process.cwd(), true)));`],
  ['Git 검사기 replacement ref', `const original = execFileSync('git', ['rev-parse', 'HEAD:scripts/verification-source.mjs'], {encoding:'utf8'}).trim(); const alternate = process.env.RUNNER_TEMP + '/replacement.mjs'; writeFileSync(alternate, 'process.exit(0);'); const replacement = execFileSync('git', ['hash-object', '-w', alternate], {encoding:'utf8'}).trim(); execFileSync('git', ['replace', original, replacement]); writeFileSync('public/asset.txt', 'installed replacement');`],
])('실제 CI 설치 단계는 %s로 숨긴 입력 변조를 거절한다', (_attack, payload) => {
  const root = repository();
  const runner = mkdtempSync(join(tmpdir(), 'demp-ci-runner-'));
  repositories.push(runner);
  const environmentFile = join(runner, 'github-env');
  writeFileSync(environmentFile, '');
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const { commands, shell } = workflowCommands(head);
  const environment = { ...process.env, RUNNER_TEMP: runner, GITHUB_WORKSPACE: root, GITHUB_ENV: environmentFile };
  const capture = spawnSync('bash', [...shell, commands[0]], { cwd: root, env: environment, encoding: 'utf8' });
  expect(capture.stderr).toBe('');
  expect(capture.status).toBe(0);
  const capturedEnvironment = Object.fromEntries(readFileSync(environmentFile, 'utf8').trim().split('\n').map(line => {
    const index = line.indexOf('='); return [line.slice(0, index), line.slice(index + 1)];
  }));
  mkdirSync(join(runner, 'bin'));
  const installer = join(runner, 'bin/npm');
  writeFileSync(join(runner, 'install.mjs'), `import {writeFileSync} from 'node:fs'; import {execFileSync} from 'node:child_process'; import {resolve} from 'node:path'; import {pathToFileURL} from 'node:url'; ${payload}`);
  writeFileSync(installer, '#!/bin/sh\nnode "$RUNNER_TEMP/install.mjs"\n');
  chmodSync(installer, 0o755);
  const install = spawnSync('bash', [...shell, commands[1]], { cwd: root, encoding: 'utf8', env: { ...environment, ...capturedEnvironment, PATH: `${join(runner, 'bin')}:${process.env.PATH}` } });
  expect(install.status).toBe(1);
  expect(install.stderr).toMatch(/Source input changed/);
});

test('실제 CI shell은 Git 검사 코드 조회 실패를 정상 실행으로 취급하지 않는다', () => {
  const root = repository();
  const runner = mkdtempSync(join(tmpdir(), 'demp-ci-shell-'));
  repositories.push(runner);
  mkdirSync(join(runner, 'bin'));
  writeFileSync(join(runner, 'bin/git'), '#!/bin/sh\nexit 42\n');
  chmodSync(join(runner, 'bin/git'), 0o755);
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const { commands, shell } = workflowCommands(head);
  const result = spawnSync('bash', [...shell, commands[0]], { cwd: root, encoding: 'utf8', env: { ...process.env, RUNNER_TEMP: runner, GITHUB_WORKSPACE: root, GITHUB_ENV: join(runner, 'github-env'), PATH: `${join(runner, 'bin')}:${process.env.PATH}` } });
  expect(result.status).not.toBe(0);
});
