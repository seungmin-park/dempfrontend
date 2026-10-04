import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  vueWarnings: [async ({ context }, use, testInfo) => {
    const warnings = [];
    function observe(page) {
      page.on('console', message => {
        if (message.text().includes('[Vue warn]')) warnings.push({ url: page.url(), text: message.text() });
      });
    }
    context.pages().forEach(observe);
    context.on('page', observe);
    await use(warnings);
    context.off('page', observe);
    await testInfo.attach('vue-warnings', { body: Buffer.from(JSON.stringify(warnings)), contentType: 'application/json' });
    expect(warnings, 'Unexpected [Vue warn] in the browser').toEqual([]);
  }, { auto: true }],
});
export { expect };
