// @vitest-environment node
import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validateUnitReport, validateBrowserReport, validateBuild } from '../../scripts/verify-results.mjs';

const required = { unitFiles: ['tests/unit/Reaction.spec.js'], unitAssertions: [{ file: 'tests/unit/Reaction.spec.js', title: '저장 실패 뒤 재시도' }], e2eTests: [{ file: 'reaction.spec.js', title: '새로고침 뒤 저장 유지' }] };
function unit() {
  return { success: true, numTotalTestSuites: 1, numPassedTestSuites: 1, numFailedTestSuites: 0, numPendingTestSuites: 0, numTotalTests: 1, numPassedTests: 1, numFailedTests: 0, numPendingTests: 0, numTodoTests: 0, testResults: [{ name: '/project/tests/unit/Reaction.spec.js', status: 'passed', assertionResults: [{ fullName: '저장 실패 뒤 재시도', status: 'passed' }] }] };
}
function browser() {
  return { errors: [], stats: { expected: 1, unexpected: 0, flaky: 0, skipped: 0 }, suites: [{ title: 'reaction.spec.js', specs: [{ file: 'reaction.spec.js', title: '새로고침 뒤 저장 유지', ok: true, tests: [{ expectedStatus: 'passed', status: 'expected', results: [{ status: 'passed', retry: 0 }] }] }], suites: [] }] };
}
test('필수 단위 assertion과 브라우저 계약의 실제 통과 보고서를 받는다', () => {
  expect(() => validateUnitReport(unit(), required, '/project')).not.toThrow();
  expect(() => validateBrowserReport(browser(), required)).not.toThrow();
});
test.each([
  ['빈 실행', r => { r.testResults = []; r.numTotalTests = 0; }],
  ['필수 파일 누락', r => { r.testResults[0].name = '/project/tests/unit/Other.spec.js'; }],
  ['필수 assertion 삭제', r => { r.testResults[0].assertionResults[0].fullName = '다른 검사'; }],
  ['skip', r => { r.testResults[0].assertionResults[0].status = 'pending'; }],
  ['실패', r => { r.success = false; }],
  ['집계 불일치', r => { r.numPassedTests = 2; }],
  ['중복 파일', r => { r.testResults.push(structuredClone(r.testResults[0])); }],
])('단위 보고서의 %s를 거절한다', (_name, mutate) => {
  const report = unit(); mutate(report);
  expect(() => validateUnitReport(report, required, '/project')).toThrow();
});
test.each([
  ['빈 실행', r => { r.suites = []; }],
  ['필수 흐름 누락', r => { r.suites[0].specs[0].title = '다른 흐름'; }],
  ['skip', r => { r.suites[0].specs[0].tests[0].results[0].status = 'skipped'; }],
  ['재시도로 가린 실패', r => { r.suites[0].specs[0].tests[0].results.unshift({ status: 'failed', retry: 0 }); r.suites[0].specs[0].tests[0].results[1].retry = 1; }],
  ['실행 오류', r => { r.errors.push({ message: 'server failed' }); }],
  ['집계 불일치', r => { r.stats.expected = 2; }],
])('브라우저 보고서의 %s를 거절한다', (_name, mutate) => {
  const report = browser(); mutate(report);
  expect(() => validateBrowserReport(report, required)).toThrow();
});
test('빈 필수 계약 목록을 성공으로 취급하지 않는다', () => {
  expect(() => validateUnitReport(unit(), { ...required, unitFiles: [] }, '/project')).toThrow();
  expect(() => validateBrowserReport(browser(), { ...required, e2eTests: [] })).toThrow();
});
const builds = [];
afterEach(() => builds.splice(0).forEach(dir => rmSync(dir, { recursive: true, force: true })));
function build() {
  const dir = mkdtempSync(join(tmpdir(), 'demp-build-test-')); builds.push(dir);
  mkdirSync(join(dir, 'assets'));
  writeFileSync(join(dir, 'index.html'), '<script type="module" src="/assets/app.js"></script><link rel="stylesheet" href="/assets/app.css">');
  writeFileSync(join(dir, 'assets/app.js'), 'console.log("production")');
  writeFileSync(join(dir, 'assets/app.css'), 'body{margin:0}');
  return dir;
}
test('HTML이 가리키는 production JS와 CSS가 있어야 한다', () => {
  const dir = build(); expect(() => validateBuild(dir)).not.toThrow();
  rmSync(join(dir, 'assets/app.js'));
  expect(() => validateBuild(dir)).toThrow();
});
test.each(['/src/main.ts', '/@vite/client', '/../outside.js'])('개발·dist 이탈 경로 %s를 거절한다', path => {
  const dir = build(); writeFileSync(join(dir, 'index.html'), `<script type="module" src="${path}"></script>`);
  expect(() => validateBuild(dir)).toThrow();
});
test('테스트 전용 인증 토큰이 배포 파일에 들어가면 거절한다', () => {
  const dir = build(); writeFileSync(join(dir, 'assets/app.js'), 'const token="fixture-token";');
  expect(() => validateBuild(dir)).toThrow();
});
