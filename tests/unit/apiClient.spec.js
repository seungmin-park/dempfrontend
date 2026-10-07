import { vi } from 'vitest';
import { createApiClient } from '@/api/client';
import { AxiosError } from 'axios';

vi.unmock('axios');

test('요청 시 현재 토큰을 붙이고 401이면 인증 만료를 한 번 알린다', async () => {
  let token = 'expired-token';
  const onUnauthorized = vi.fn();
  const client = createApiClient({ baseURL: 'https://api.example', getToken: () => token, onUnauthorized });
  const requests = [];
  const adapter = async config => {
    requests.push(config);
    if (requests.length === 1) return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
    throw new AxiosError('unauthorized', undefined, config, undefined, { status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config });
  };
  await client.get('/api/question', { adapter });
  token = 'new-token';
  await expect(client.get('/api/question', { adapter })).rejects.toMatchObject({ response: { status: 401 } });
  expect(requests.map(request => request.headers['X-AUTH-TOKEN'])).toEqual(['expired-token', 'new-token']);
  expect(requests[0].baseURL).toBe('https://api.example');
  expect(onUnauthorized).toHaveBeenCalledTimes(1);
});

test.each(['new-account-token', ''])('이전 토큰 요청의 늦은 401은 변경된 로그인 상태 %s를 초기화하지 않는다', async currentToken => {
  let token = 'old-account-token', rejectRequest;
  const onUnauthorized = vi.fn();
  const client = createApiClient({ baseURL: 'https://api.example', getToken: () => token, onUnauthorized });
  const adapter = config => new Promise((resolve, reject) => {
    rejectRequest = () => reject(new AxiosError('unauthorized', undefined, config, undefined, { status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config }));
  });
  const pending = client.get('/api/admin/me', { adapter });
  await vi.waitFor(() => expect(rejectRequest).toBeTypeOf('function'));
  token = currentToken;
  rejectRequest();
  await expect(pending).rejects.toMatchObject({ response: { status: 401 } });
  expect(onUnauthorized).not.toHaveBeenCalled();
});
