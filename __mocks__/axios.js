import { vi } from 'vitest';
const axios = {
  get: vi.fn(), post: vi.fn(),
  put: vi.fn(), patch: vi.fn(), delete: vi.fn(),
  interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
};
axios.create = vi.fn(() => axios);
export default axios;
