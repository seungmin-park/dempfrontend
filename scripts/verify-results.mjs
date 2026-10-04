import { readFileSync, readdirSync, statSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}
function requiredList(items, label, key = value => value) {
  requireCondition(Array.isArray(items) && items.length > 0, `Empty ${label} contract`);
  const keys = items.map(key);
  requireCondition(keys.every(value => typeof value === 'string' && value.length > 0) && new Set(keys).size === keys.length, `Invalid or duplicate ${label} contract`);
  return keys;
}
const assertionKey = item => `${item.file}::${item.title}`;

export function validateUnitReport(report, manifest, root) {
  const files = requiredList(manifest.unitFiles, 'unit files');
  const requiredAssertions = requiredList(manifest.unitAssertions, 'unit assertions', assertionKey);
  requireCondition(report.success === true && report.testResults?.length > 0, 'Unit run failed or empty');
  const seen = new Set(), assertions = new Set();
  let count = 0;
  for (const suite of report.testResults) {
    const file = (isAbsolute(suite.name) ? relative(root, suite.name) : suite.name).replaceAll('\\', '/');
    requireCondition(!seen.has(file), `Duplicate unit file: ${file}`);
    seen.add(file);
    requireCondition(suite.status === 'passed' && suite.assertionResults?.length > 0, `Empty or failed unit file: ${file}`);
    for (const assertion of suite.assertionResults) {
      requireCondition(assertion.status === 'passed', `Unit assertion did not pass: ${file} ${assertion.fullName}`);
      assertions.add(assertionKey({ file, title: assertion.fullName })); count++;
    }
  }
  for (const file of files) requireCondition(seen.has(file), `Missing required unit file: ${file}`);
  for (const assertion of requiredAssertions) requireCondition(assertions.has(assertion), `Missing required unit assertion: ${assertion}`);
  requireCondition(report.numTotalTests === count && report.numPassedTests === count
    && report.numTotalTestSuites === seen.size && report.numPassedTestSuites === seen.size, 'Unit totals do not match assertions');
  for (const field of ['numFailedTests', 'numPendingTests', 'numTodoTests', 'numFailedTestSuites', 'numPendingTestSuites']) {
    requireCondition(report[field] === 0, `Unit ${field} must be zero`);
  }
  return { files: seen.size, passed: count };
}

export function validateBrowserReport(report, manifest) {
  const required = requiredList(manifest.e2eTests, 'browser tests', assertionKey);
  requireCondition(Array.isArray(report.errors) && report.errors.length === 0, 'Browser run has errors');
  const seen = new Set();
  let count = 0;
  function visit(suites) {
    for (const suite of suites ?? []) {
      for (const spec of suite.specs ?? []) {
        requireCondition(spec.ok === true && spec.tests?.length > 0, `Empty or failed browser spec: ${spec.title}`);
        const key = assertionKey(spec);
        requireCondition(!seen.has(key), `Duplicate browser spec: ${key}`); seen.add(key);
        for (const test of spec.tests) {
          requireCondition(test.expectedStatus === 'passed' && test.status === 'expected'
            && test.results?.length === 1 && test.results[0].status === 'passed'
            && test.results[0].retry === 0 && !(test.results[0].errors?.length), `Browser test skipped, failed or retried: ${key}`);
          count++;
        }
      }
      visit(suite.suites);
    }
  }
  visit(report.suites);
  requireCondition(count > 0, 'Empty browser run');
  for (const key of required) requireCondition(seen.has(key), `Missing required browser test: ${key}`);
  requireCondition(report.stats?.expected === count && report.stats.unexpected === 0
    && report.stats.skipped === 0 && report.stats.flaky === 0, 'Browser totals do not match passing results');
  return { passed: count };
}

export function validateBuild(dist) {
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  requireCondition(!html.includes('/@vite/client') && !/\/src\/[^"']+\.(ts|js|vue)/.test(html), 'Development HTML is not a production build');
  const references = [...html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)=["']([^"']+)["']/g)]
    .map(match => match[1]).filter(path => /\.(?:js|css)(?:\?|$)/.test(path));
  requireCondition(references.some(path => /\.js(?:\?|$)/.test(path)) && references.some(path => /\.css(?:\?|$)/.test(path)), 'Build must reference JS and CSS');
  for (const path of references) {
    requireCondition(!path.split('/').includes('..') && !/^\w+:/.test(path), `Asset leaves dist: ${path}`);
    const asset = resolve(dist, path.replace(/^\//, '').split('?')[0]);
    requireCondition(!relative(dist, asset).startsWith('..') && statSync(asset).isFile(), `Missing build asset: ${path}`);
  }
  const hash = createHash('sha256'); let files = 0;
  function visit(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = join(dir, entry.name);
      if (entry.isDirectory()) { visit(file); continue; }
      requireCondition(entry.isFile(), `Unexpected build entry: ${file}`);
      const content = readFileSync(file);
      if (/\.(html|js|css|json|map)$/.test(file)) requireCondition(!content.includes('fixture-token'), `Test fixture credential in build: ${relative(dist, file)}`);
      hash.update(relative(dist, file)).update('\0').update(content).update('\0'); files++;
    }
  }
  visit(dist);
  return { files, sha256: hash.digest('hex') };
}
