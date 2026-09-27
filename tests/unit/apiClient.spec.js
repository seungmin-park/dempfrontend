import { createApiClient } from '@/api/client';

jest.unmock('axios');

test('요청 시 현재 토큰을 붙이고 401이면 인증 만료를 한 번 알린다', async () => {
  let token = 'expired-token';
  const onUnauthorized = jest.fn();
  const client = createApiClient({ baseURL: 'https://api.example', getToken: () => token, onUnauthorized });
  const requests = [];
  const adapter = async config => {
    requests.push(config);
    if (requests.length === 1) return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
    throw { response: { status: 401 }, config };
  };
  await client.get('/api/question', { adapter });
  token = 'new-token';
  await expect(client.get('/api/question', { adapter })).rejects.toMatchObject({ response: { status: 401 } });
  expect(requests.map(request => request.headers['X-AUTH-TOKEN'])).toEqual(['expired-token', 'new-token']);
  expect(requests[0].baseURL).toBe('https://api.example');
  expect(onUnauthorized).toHaveBeenCalledTimes(1);
});
