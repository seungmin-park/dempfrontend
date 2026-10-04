export function createVueWarningGate() {
  const warnings = [];
  return {
    record(message) { warnings.push(message); },
    verify() { if (warnings.length) throw new Error(`[Vue warn] ${warnings.join('\n[Vue warn] ')}`); },
    reset() { warnings.length = 0; },
  };
}
