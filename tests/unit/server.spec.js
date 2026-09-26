/** @jest-environment node */
const http = require('http');
const app = require('../../server');

test('운영 Express의 없는 API GET은 HTML 대신 JSON 404를 반환한다', async () => {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  try {
    const response = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${server.address().port}/api/missing`, res => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, type: res.headers['content-type'], body }));
      }).on('error', reject);
    });
    expect(response.status).toBe(404);
    expect(response.type).toContain('application/json');
    expect(JSON.parse(response.body)).toEqual({ error: 'API route not found' });
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
