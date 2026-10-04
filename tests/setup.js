import { config, enableAutoUnmount } from '@vue/test-utils';
import { afterEach, beforeEach, vi } from 'vitest';
import { createVueWarningGate } from './support/vue-warning-gate';

enableAutoUnmount(afterEach);
const warnings = createVueWarningGate();
let warnSpy;
beforeEach(() => {
  warnings.reset();
  config.global.config.warnHandler = warnings.record;
  const originalWarn = console.warn.bind(console);
  warnSpy = vi.spyOn(console, 'warn').mockImplementation((...args) => {
    const message = args.map(String).join(' ');
    if (message.includes('[Vue warn]')) warnings.record(message);
    originalWarn(...args);
  });
});
afterEach(() => { try { warnings.verify(); } finally { warnSpy.mockRestore(); } });
