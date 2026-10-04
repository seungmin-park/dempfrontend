// @vitest-environment node
import { ESLint } from 'eslint';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

const lint = new ESLint({ cwd: fileURLToPath(new URL('../..', import.meta.url)) });
test.each([
  ['명시적 any', 'export const unsafe: any = 1;', '@typescript-eslint/no-explicit-any'],
  ['ts-ignore', '// @ts-ignore\nexport const wrong: number = "invalid";', '@typescript-eslint/ban-ts-comment'],
  ['ts-nocheck', '// @ts-nocheck\nexport const wrong: number = "invalid";', '@typescript-eslint/ban-ts-comment'],
  ['ts-expect-error', '// @ts-expect-error An application must fix the type instead of hiding the error.\nexport const wrong: number = "invalid";', '@typescript-eslint/ban-ts-comment'],
])('앱 소스의 %s 타입 검사 우회를 거절한다', async (_label, source, rule) => {
  const [result] = await lint.lintText(source, { filePath: 'src/type-bypass-probe.ts' });
  expect(result.messages.some(message => message.ruleId === rule && message.severity === 2)).toBe(true);
});
