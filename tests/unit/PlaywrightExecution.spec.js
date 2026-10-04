// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest';
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
test('격리 포트의 새 production preview에서 브라우저를 실행한다', async () => {
  vi.stubEnv('DEMP_E2E_PORT', '5193');
  vi.stubEnv('DEMP_DEV_E2E_PORT', '5194');
  const { default: config } = await import('../../playwright.config.js');
  expect(config.use.baseURL).toBe('http://127.0.0.1:5193');
  expect(config.projects.map(project => project.name)).toEqual(['production', 'development']);
  expect(config.webServer[0].command).toBe('npm run preview -- --host 127.0.0.1 --port 5193 --strictPort');
  expect(config.webServer[1].command).toBe('npm run dev -- --host 127.0.0.1 --port 5194 --strictPort');
  expect(config.webServer.every(server => server.reuseExistingServer === false)).toBe(true);
});
test.each(['0', '65536', '5050;echo nope', 'NaN'])('잘못된 포트 %s는 실행 전에 거절한다', async port => {
  vi.stubEnv('DEMP_E2E_PORT', port);
  await expect(import('../../playwright.config.js')).rejects.toThrow('DEMP_E2E_PORT');
});
