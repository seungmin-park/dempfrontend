/** @vitest-environment node */
import http from 'node:http';
import { createServer } from 'vite';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

it('개발 서버는 로컬 업로드 이미지를 HTML로 바꾸지 않고 백엔드 바이트를 전달한다', async () => {
  const bytes = Buffer.from([137,80,78,71,13,10,26,10]);
  const backend = http.createServer((req,res) => { res.writeHead(200, { 'Content-Type': 'image/png' }); res.end(bytes); });
  await new Promise(resolve => backend.listen(0,'127.0.0.1',resolve));
  const previous = process.env.DEV_API_TARGET;
  process.env.DEV_API_TARGET = `http://127.0.0.1:${backend.address().port}`;
  const cacheDir = await mkdtemp(join(tmpdir(), 'demp-proxy-cache-'));
  let frontend;
  try {
    frontend = await createServer({ cacheDir, optimizeDeps: { noDiscovery: true, include: [] }, logLevel: 'silent', server: { host: '127.0.0.1', port: 0, strictPort: false, watch: null } });
    await frontend.listen();
    const response = await fetch(`http://127.0.0.1:${frontend.httpServer.address().port}/local-files/probe.png`);
    expect(response.headers.get('content-type')).toContain('image/png');
    expect(Buffer.from(await response.arrayBuffer())).toEqual(bytes);
  } finally {
    await frontend?.close();
    await rm(cacheDir, { recursive: true, force: true });
    await new Promise(resolve => backend.close(resolve));
    if (previous === undefined) delete process.env.DEV_API_TARGET; else process.env.DEV_API_TARGET = previous;
  }
});
