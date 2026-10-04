// @vitest-environment node
import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

const roots = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
function inspect(file, source) {
  const root = mkdtempSync(join(tmpdir(), 'demp-boundary-test-'));
  roots.push(root);
  const path = join(root, 'src', file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, source);
  return spawnSync(process.execPath, ['scripts/check-agent-contracts.mjs', '--scan-root', root], { encoding: 'utf8' });
}
test.each([
  ['components/Rogue.vue', "<script setup lang='ts'>import { setReaction } from '@/api/reactions';</script>"],
  ['components/Rogue.vue', "<script setup lang='ts'>import * as reactions from '@/api/reactions';</script>"],
  ['views/Rogue.vue', "<script setup>const api = import('@/api/reactions');</script>"],
  ['components/Rogue.vue', "<script src='../api/reactions.ts'></script>"],
  ['other.ts', "export { setReaction as write } from './api/reactions';"],
])('%s의 반응 쓰기 지름길은 거절한다: %s', (file, source) => {
  const result = inspect(file, source);
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('reaction owner');
});
test.each([
  ['views/Rogue.vue', "<script setup>import axios from 'axios';</script>"],
  ['components/Rogue.vue', "<script setup>import { apiClient } from '../api/client';</script>"],
  ['composables/rogue.ts', "import View from '@/views/View.vue';"],
  ['api/rogue.ts', "import { useContentReaction } from '@/composables/useContentReaction';"],
])('%s의 책임 역참조는 거절한다: %s', (file, source) => {
  const result = inspect(file, source);
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/transport boundary|reverse dependency/);
});
test.each([
  ['components/Good.vue', "<script setup lang='ts'>import type { ReactionTarget } from '@/api/reactions';</script>"],
  ['components/Good.vue', "<script setup lang='ts'>import { type ReactionTarget } from '@/api/reactions';</script>"],
  ['components/Good.vue', "<script setup>/* import { setReaction } from '@/api/reactions' */ const text = \"import { setReaction } from '@/api/reactions'\";</script>"],
  ['composables/useContentReaction.ts', "import { setReaction } from '@/api/reactions';"],
  ['views/Good.vue', "<script setup>import { getQuestion } from '@/api/questions';</script>"],
])('%s의 정상 협력·타입·문자열은 허용한다: %s', (file, source) => {
  expect(inspect(file, source).status).toBe(0);
});
