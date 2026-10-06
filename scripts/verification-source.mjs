import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function git(root, args) {
  return execFileSync('git', ['--no-replace-objects', ...args], { cwd: root, encoding: 'utf8' });
}

const generated = new Set(['.git', 'node_modules', 'dist', '.verification', 'test-results', 'playwright-report', '.worktrees']);
function inputFiles(root, tracked) {
  const files = new Set(tracked);
  function visit(directory, prefix) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (!prefix && generated.has(entry.name)) continue;
      const name = prefix + entry.name;
      if (entry.isDirectory()) visit(resolve(root, name), name + '/');
      else if (entry.isFile()) files.add(name);
      else throw new Error(`Source input has an unsupported file type: ${name}`);
    }
  }
  visit(root, '');
  return [...files].sort();
}

function committedFiles(root, head) {
  return git(root, ['ls-tree', '-r', '-z', head]).split('\0').filter(Boolean).map(item => {
    const boundary = item.indexOf('\t');
    const [mode, type, object] = item.slice(0, boundary).split(' ');
    if (type !== 'blob' || !['100644', '100755'].includes(mode)) throw new Error('Source input has an unsupported Git file type');
    return { name: item.slice(boundary + 1), mode, object };
  });
}

function assertCommittedFiles(root, entries, contents) {
  if (entries.length !== contents.size || entries.some(entry => !contents.has(entry.name))) {
    throw new Error('Source input changed: files differ from the recorded Git tree');
  }
  // One batch reads immutable blob content. Index flags and mutable snapshot claims are irrelevant.
  const blobs = execFileSync('git', ['--no-replace-objects', 'cat-file', '--batch'], {
    cwd: root, input: entries.map(entry => entry.object).join('\n') + '\n', maxBuffer: 128 * 1024 * 1024,
  });
  let offset = 0;
  for (const entry of entries) {
    const end = blobs.indexOf(10, offset);
    const [object, type, length] = blobs.subarray(offset, end).toString().split(' ');
    const size = Number(length);
    if (end < offset || object !== entry.object || type !== 'blob' || !Number.isSafeInteger(size) || size < 0) {
      throw new Error('Source input Git blob could not be read');
    }
    const original = blobs.subarray(end + 1, end + 1 + size);
    const executable = (lstatSync(resolve(root, entry.name)).mode & 0o111) !== 0;
    if (!original.equals(contents.get(entry.name)) || executable !== (entry.mode === '100755')) {
      throw new Error(`Source input changed from the recorded Git blob: ${entry.name}`);
    }
    offset = end + 1 + size + 1;
  }
}

export function captureSource(root, ci = false) {
  if (ci && readdirSync(root).some(file => /^\.env(?:\..+)?\.local$/.test(file))) {
    throw new Error('CI rejects local environment files');
  }
  const head = git(root, ['rev-parse', 'HEAD']).trim();
  const committed = ci ? committedFiles(root, head) : [];
  const tracked = ci ? committed.map(entry => entry.name) : git(root, ['ls-files', '--cached', '-z']).split('\0').filter(Boolean);
  const contents = new Map(inputFiles(root, tracked).map(file => [file, readFileSync(resolve(root, file))]));
  if (ci) assertCommittedFiles(root, committed, contents);
  const hash = createHash('sha256');
  for (const [file, content] of contents) {
    hash.update(file).update('\0').update(content).update('\0');
  }
  return { version: 1, head, sourceSha256: hash.digest('hex') };
}

export function assertSource(snapshot, root, ci = false) {
  const current = captureSource(root, ci);
  if (snapshot.version !== 1 || snapshot.head !== current.head || snapshot.sourceSha256 !== current.sourceSha256) {
    throw new Error('Source input changed from the verification baseline');
  }
}

// CI pipes the dependency-free checker directly from the pinned Git commit, before/after npm.
if (process.argv[1] === '-' || (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url))) {
  try {
    const [command, root, destination, expectedHead] = process.argv.slice(2);
    if (!['capture', 'check'].includes(command) || !root || !destination || !expectedHead) {
      throw new Error('Usage: verification-source.mjs capture|check ROOT SNAPSHOT EXPECTED_HEAD');
    }
    const snapshot = command === 'capture' ? captureSource(root, true) : JSON.parse(readFileSync(destination, 'utf8'));
    if (snapshot.head !== expectedHead) throw new Error('Source input does not match the CI commit');
    assertSource(snapshot, root, true);
    if (command === 'capture') writeFileSync(destination, JSON.stringify(snapshot, null, 2) + '\n', { flag: 'wx' });
    console.log(`PASS: source input ${snapshot.head} ${snapshot.sourceSha256}`);
  } catch (error) {
    console.error(error.message); process.exitCode = 1;
  }
}
