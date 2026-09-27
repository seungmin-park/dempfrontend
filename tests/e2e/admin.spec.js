import { test, expect } from '@playwright/test';

async function adminFixture(page, role = 'admin') {
  const state = { role, expired: false, items: [], nextId: 10, post: { id: 5, questionId: 5, title: '기존 질문', content: '<h2>기존 HTML</h2><p><u>보존할 밑줄</u></p>', username: 'author', hashtags: ['JAVA'] } };
  if (role !== 'guest') await page.addInitScript(() => localStorage.setItem('vuex', JSON.stringify({ Login: { username: 'fixture', token: 'fixture-token', roles: ['ROLE_ADMIN'] } })));
  await page.route(/^https:\/\//, route => route.abort());
  await page.route('http://127.0.0.1:5050/api/**', async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname, method = request.method();
    const reply = (status, data) => route.fulfill({ status, contentType: 'application/json', body: status === 204 ? '' : JSON.stringify(data) });
    if (!path.startsWith('/api/admin')) return reply(200, { content: [], number: 0, last: true });
    if (state.expired || state.role === 'guest') return reply(401, {});
    if (state.role !== 'admin') return reply(403, {});
    if (path === '/api/admin/me') return reply(200, { id: 1, username: 'fixture' });
    if (path === '/api/admin/overview') return reply(200, { announcements: state.items.length, bootcamps: 0, questions: 1, answers: 0, members: 2 });
    if (path === '/api/admin/announcements' && method === 'GET') return reply(200, { content: state.items.map(item => ({ ...item, company: item.company.name })), last: true, number: 0 });
    if (path.includes('/announcements') && ['POST','PATCH'].includes(method)) {
      const body = request.postData() || '';
      const value = name => [...body.matchAll(new RegExp(`name="${name}"\\r?\\n\\r?\\n([\\s\\S]*?)\\r?\\n--`, 'g'))].map(match => match[1]);
      const fields = Object.fromEntries(['title','content','accessUrl','position','startedDate','deadLineDate','minCareer','maxCareer','payment'].map(name => [name, value(name)[0]]));
      for (const key of ['minCareer','maxCareer','payment']) fields[key] = Number(fields[key]);
      const id = method === 'POST' ? state.nextId++ : Number(path.split('/').pop());
      const item = { ...fields, id, company: { name: value('company')[0] }, announcementType: value('type')[0], language: value('language'), image: '' };
      state.items = [...state.items.filter(row => row.id !== id), item];
      return reply(method === 'POST' ? 201 : 200, { cleanupPending: false });
    }
    const announcement = path.match(/\/announcements\/(\d+)$/);
    if (announcement) {
      const id = Number(announcement[1]);
      if (method === 'DELETE') { state.items = state.items.filter(item => item.id !== id); return reply(200, { cleanupPending: false }); }
      const item = state.items.find(item => item.id === id);
      return reply(item ? 200 : 404, item || {});
    }
    if (path === '/api/admin/questions') return reply(200, { content: [state.post], last: true, number: 0, totalElements: 1 });
    if (path === '/api/admin/questions/5') {
      if (method === 'PATCH') { state.post = { ...state.post, ...request.postDataJSON() }; return reply(204); }
      return reply(200, state.post);
    }
    return reply(404, {});
  });
  return state;
}

test('관리자 직접 URL은 비로그인 사용자를 로그인으로 보낸다', async ({ page }) => {
  await adminFixture(page, 'guest'); await page.goto('/admin/announcements/new');
  await expect(page).toHaveURL(/\/login\?redirect=/);
  await expect(page.getByLabel('아이디')).toBeVisible();
});

test('localStorage 관리자 역할을 넣어도 일반 회원은 운영 화면을 볼 수 없다', async ({ page }) => {
  await adminFixture(page, 'member'); await page.goto('/admin');
  await expect(page.getByRole('alert')).toContainText('관리자 권한');
  await expect(page.locator('.admin-stats')).toHaveCount(0);
});

test('모바일 관리자는 공고 등록 수정 재조회 삭제 확인을 진행한다', async ({ page }) => {
  const state = await adminFixture(page); await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/announcements');
  await page.getByRole('link', { name: '공고 등록', exact: true }).click();
  await page.getByRole('textbox', { name: '제목', exact: true }).fill('새 관리자 공고');
  await page.getByLabel('회사·교육기관').fill('DEMP 교육');
  await page.getByLabel('지원 페이지').fill('https://example.test/apply');
  await page.getByLabel('공고 종류', { exact: true }).selectOption('EDU');
  await page.getByLabel('분야', { exact: true }).selectOption('BACKEND');
  await page.getByLabel('모집 시작').fill('2026-09-01T09:00');
  await page.getByLabel('모집 마감').fill('2026-12-31T18:00');
  await page.getByLabel('Java', { exact: true }).check();
  await page.getByLabel('Spring', { exact: true }).check();
  await page.locator('#admin-image').setInputFiles({ name: 'fixture.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/F9sAAAAASUVORK5CYII=', 'base64') });
  await page.locator('#admin-content').fill('## 교육 소개\n\n- Java와 Spring');
  await page.getByRole('button', { name: '등록하기' }).click();
  await expect(page).toHaveURL(/\/admin\/announcements$/);
  expect(state.items[0].content).toContain('<h2>교육 소개</h2>');
  await page.getByRole('link', { name: '새 관리자 공고', exact: true }).click();
  await expect(page.locator('#admin-content')).toHaveValue(/## 교육 소개/);
  await page.getByRole('textbox', { name: '제목', exact: true }).fill('수정 관리자 공고');
  await page.locator('#admin-content').fill('## 수정 교육');
  await page.getByRole('button', { name: '변경 저장' }).click();
  await expect(page).toHaveURL(/\/admin\/announcements$/);
  await page.reload();
  await expect(page.getByRole('link', { name: '수정 관리자 공고', exact: true })).toBeVisible();
  await expect(page.locator('.admin-row')).toContainText('Java, Spring');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: '삭제', exact: true }).click();
  await page.getByRole('button', { name: '취소', exact: true }).click();
  expect(state.items).toHaveLength(1);
  await page.getByRole('button', { name: '삭제', exact: true }).click();
  await page.getByRole('button', { name: '삭제하기', exact: true }).click();
  await expect(page.locator('.admin-row')).toHaveCount(0);
  expect(state.items).toHaveLength(0);
});

test('관리자가 기존 HTML 질문을 수정해도 제목 서식과 밑줄은 재조회에서 유지된다', async ({ page }) => {
  const state = await adminFixture(page); await page.goto('/admin/questions/5');
  await expect(page.locator('#admin-content')).toHaveValue(/## 기존 HTML/);
  await page.locator('#admin-content').fill('## 수정 HTML\n\n<u>보존할 밑줄</u>');
  await page.getByRole('button', { name: '변경 저장' }).click();
  await expect(page).toHaveURL(/\/admin\/questions$/);
  await page.getByRole('link', { name: '기존 질문', exact: true }).click();
  await page.getByText('현재 저장된 내용 보기', { exact: true }).click();
  await expect(page.locator('.admin-original h2')).toHaveText('수정 HTML');
  await expect(page.locator('.admin-original u')).toHaveText('보존할 밑줄');
  expect(state.post.username).toBe('author');
});

test('운영 중 권한 회수와 토큰 만료는 다음 서버 요청에서 반영된다', async ({ page }) => {
  const state = await adminFixture(page); await page.goto('/admin');
  await expect(page.locator('[data-test="stat-members"]')).toContainText('2');
  state.role = 'member';
  await page.getByRole('button', { name: '새로고침', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('접근 권한');
  await expect(page.locator('.admin-stats')).toHaveCount(0);
  state.role = 'admin'; state.expired = true;
  await page.getByRole('button', { name: '재시도', exact: true }).click();
  await expect(page).toHaveURL(/\/login\?redirect=/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('vuex')).Login.token)).toBe('');
});
