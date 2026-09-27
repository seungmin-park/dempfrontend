import { test, expect } from '@playwright/test';

function multipartValue(body, name) {
  const match = body.match(new RegExp(`name="${name}"\\r?\\n\\r?\\n([^\\r\\n]+)`));
  return match && match[1];
}

async function isolatedCommunity(page) {
  const state = {
    members: new Map(),
    tokens: new Map(),
    questions: [],
    answers: [],
    requests: [],
    expired: false,
  };
  await page.route(/^https:\/\//, route => route.abort());
  await page.route('http://127.0.0.1:5050/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    state.requests.push({ path, method, search: url.search, token: request.headers()['x-auth-token'] });
    const reply = (status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    const username = state.tokens.get(request.headers()['x-auth-token']);
    if (path === '/api/member/validUsername') return reply(200, !state.members.has(url.searchParams.get('username')));
    if (path === '/api/member/save' && method === 'POST') {
      const name = multipartValue(request.postData(), 'username');
      state.members.set(name, multipartValue(request.postData(), 'password'));
      return reply(200, { id: state.members.size, username: name });
    }
    if (path === '/api/member/login' && method === 'POST') {
      const name = multipartValue(request.postData(), 'username');
      if (state.members.get(name) !== multipartValue(request.postData(), 'password')) return reply(401, { message: 'invalid' });
      const token = `fixture-token-${name}`;
      state.tokens.set(token, name);
      return reply(200, { jwt: token, username: name });
    }
    if (path === '/api/announce' && method === 'GET') {
      const emp = url.searchParams.get('announcementType');
      return reply(200, { content: emp === 'EDU' ? [] : [{ id: 71, title: '개발자 채용', language: ['JAVA'], position: 'BACKEND', image: '/fixture.png' }], number: 0, last: true });
    }
    if (path === '/api/announce/detail/71') {
      if (!username || state.expired) return reply(401, { message: 'expired' });
      return reply(200, { title: '개발자 채용', company: { name: '테스트 회사' }, announcementType: 'EMP', position: 'BACKEND', language: ['JAVA'], minCareer: 0, maxCareer: 0, startedDate: '2026-09-01T00:00:00', deadLineDate: '2026-10-01T00:00:00', content: '<p>안전한 공고</p><img src=x onerror="window.__xss = true">', accessUrl: '/apply', payment: 3000, image: '/fixture.png' });
    }
    if (path === '/api/question/hashtags') return reply(200, []);
    if (path === '/api/question' && method === 'GET') {
      const title = url.searchParams.get('title') || '';
      const content = url.searchParams.get('content') || '';
      const questions = state.questions.filter(q => q.title.includes(title) && q.content.includes(content));
      return reply(200, { content: questions.map(({ id, title }) => ({ id, title, hits: 0, recommend: 0 })), number: 0, last: true });
    }
    if (path === '/api/question/add' && method === 'POST') {
      if (!username || state.expired) return reply(401, { message: 'expired' });
      const form = request.postDataJSON();
      state.questions.push({ id: state.questions.length + 1, title: form.title, content: form.content, username, hashtags: form.hashtags });
      return reply(200, 'ok');
    }
    const questionDetail = path.match(/^\/api\/question\/detail\/(\d+)$/);
    if (questionDetail) {
      if (!username || state.expired) return reply(401, { message: 'expired' });
      const question = state.questions.find(q => q.id === Number(questionDetail[1]));
      return question ? reply(200, { ...question, hits: 1, recommend: 0, dislike: 0 }) : reply(404, {});
    }
    if (path === '/api/question/update' && method === 'PATCH') {
      const form = request.postDataJSON();
      const question = state.questions.find(q => q.id === form.questionId);
      return reply(question && question.username === username ? 200 : 403, {});
    }
    const answerList = path.match(/^\/api\/answer\/(\d+)$/);
    if (answerList) return reply(200, state.answers.filter(a => a.questionId === Number(answerList[1])));
    if (path === '/api/answer/save' && method === 'POST') {
      if (!username || state.expired) return reply(401, { message: 'expired' });
      const form = request.postDataJSON();
      state.answers.push({ answerId: state.answers.length + 1, questionId: Number(form.questionId), username, content: form.answerContent, recommend: 0, dislike: 0 });
      return reply(200, state.answers.filter(a => a.questionId === Number(form.questionId)));
    }
    return reply(404, { message: 'fixture endpoint missing' });
  });
  return state;
}

async function loginAs(page, state, name) {
  state.members.set(name, 'secret');
  await page.goto('/login');
  await page.locator('#username').fill(name);
  await page.locator('#password').fill('secret');
  await page.locator('form').getByRole('button', { name: '로그인' }).click();
  await expect(page).toHaveURL('/');
}

test('회원가입부터 공고·질문·답변의 별도 재조회까지', async ({ page }) => {
  const state = await isolatedCommunity(page);
  await page.goto('/account');
  await page.locator('#username').fill('writer');
  await page.getByRole('button', { name: '아이디 중복 검사' }).click();
  await expect(page.getByText('사용 가능한 아이디')).toBeVisible();
  await page.locator('#password').fill('secret');
  await page.locator('#checkedPassword').fill('secret');
  await page.getByRole('button', { name: '회원가입' }).click();
  await expect(page).toHaveURL('/login');
  await page.locator('#username').fill('writer');
  await page.locator('#password').fill('secret');
  await page.locator('form').getByRole('button', { name: '로그인' }).click();
  await expect(page).toHaveURL('/');
  await page.locator('#emp').check();
  await expect(page.locator('.notice-title')).toHaveText('개발자 채용');
  await page.locator('.notice-title').click();
  await expect(page).toHaveURL('/detail/71');
  await expect(page.getByRole('heading', { name: '개발자 채용' })).toBeVisible();
  await expect(page.getByText('테스트 회사', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: '면접 질문' }).click();
  await page.getByRole('button', { name: '질문하기' }).click();
  await page.locator('#question-title').fill('독립 조회 질문');
  await page.locator('#content').fill('질문 본문');
  await page.getByRole('button', { name: '작성하기' }).click();
  await expect(page.locator('.question-list-title')).toHaveText('독립 조회 질문');
  await page.locator('.question-list-title').click();
  await expect(page.getByText('질문 본문')).toBeVisible();
  await page.locator('#answer').fill('별도 조회 답변');
  await page.getByRole('button', { name: '댓글 달기' }).click();
  await expect(page.getByText('별도 조회 답변')).toBeVisible();
  await page.reload();
  await expect(page.getByText('질문 본문')).toBeVisible();
  await expect(page.getByText('별도 조회 답변')).toBeVisible();
  expect(state.requests.filter(r => r.path === '/api/answer/1').length).toBeGreaterThanOrEqual(2);
});

test('타인 수정 거절과 만료된 인증 상태 정리', async ({ page }) => {
  const state = await isolatedCommunity(page);
  state.questions.push({ id: 1, title: '다른 사람 질문', content: '본문', username: 'owner', hashtags: [] });
  await loginAs(page, state, 'reader');
  const forbidden = await page.evaluate(() => fetch('/api/question/update', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'X-AUTH-TOKEN': 'fixture-token-reader' },
    body: JSON.stringify({ questionId: 1, title: '변조' }),
  }).then(response => response.status));
  expect(forbidden).toBe(403);
  expect(state.questions[0].title).toBe('다른 사람 질문');
  state.expired = true;
  await page.goto('/questions/1');
  await expect(page).toHaveURL(/\/login\?redirect=/);
  await page.reload();
  await expect(page.locator('form').getByRole('button', { name: '로그인' })).toBeVisible();
});

test('HTML 콘텐츠를 안전하게 렌더링하고 새로고침 후 인증을 유지한다', async ({ page }) => {
  const state = await isolatedCommunity(page);
  state.questions.push({ id: 1, title: 'HTML 질문', content: '<p>표시할 문장</p><img src=x onerror="window.__xss=true"><script>window.__xss=true</script>', username: 'writer', hashtags: [] });
  await loginAs(page, state, 'writer');
  await page.goto('/questions/1');
  await expect(page.getByText('표시할 문장')).toBeVisible();
  expect(await page.evaluate(() => window.__xss)).toBeFalsy();
  await page.reload();
  await expect(page.getByText('표시할 문장')).toBeVisible();
  await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();
});

test('늦게 도착한 이전 검색 결과가 새 결과를 덮지 않는다', async ({ page }) => {
  await isolatedCommunity(page);
  let releaseOld;
  await page.route('**/api/question?*', async route => {
    const title = new URL(route.request().url()).searchParams.get('title');
    if (title === '이전') await new Promise(resolve => { releaseOld = resolve; });
    const questions = title === '최신' ? [{ id: 2, title: '최신 질문', hits: 0, recommend: 0 }]
      : title === '이전' ? [{ id: 1, title: '이전 질문', hits: 0, recommend: 0 }] : [];
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ content: questions, number: 0, last: true }) });
  });
  await page.goto('/question');
  await page.getByPlaceholder('제목, 내용으로 검색하세요').fill('이전');
  await page.getByRole('button', { name: '검색' }).click();
  await expect.poll(() => Boolean(releaseOld)).toBe(true);
  await page.getByPlaceholder('제목, 내용으로 검색하세요').fill('최신');
  await page.getByRole('button', { name: '검색' }).click();
  await expect(page.locator('.question-list-title')).toHaveText('최신 질문');
  releaseOld();
  await expect(page.locator('.question-list-title')).toHaveText('최신 질문');
});

function announcementFixture(id, title = `스크롤 공고 ${id}`) {
  return { id, title, language: ['JAVA'], position: 'BACKEND', image: '/fixture.png' };
}

test('실제 스크롤은 다음 페이지를 한 번씩 요청하고 마지막에서 멈춘다', async ({ page }) => {
  await isolatedCommunity(page);
  await page.setViewportSize({ width: 900, height: 450 });
  const pages = [];
  const announcements = Array.from({ length: 18 }, (_, i) => announcementFixture(i + 1));
  await page.route('**/api/announce?*', route => {
    const current = Number(new URL(route.request().url()).searchParams.get('page'));
    pages.push(current);
    return route.fulfill({ json: { content: announcements.slice(current * 8, current * 8 + 8), last: current === 2 } });
  });
  await page.goto('/');
  await expect(page.locator('.notice-title')).toHaveCount(8);
  await page.locator('[data-test="list-end"]').scrollIntoViewIfNeeded();
  await expect(page.locator('.notice-title')).toHaveCount(16);
  await page.locator('[data-test="list-end"]').scrollIntoViewIfNeeded();
  await expect(page.locator('.notice-title')).toHaveCount(18);
  await expect(page.getByText('더 이상 채용/교육 공고')).toBeVisible();
  await page.mouse.wheel(0, 2000);
  expect(pages).toEqual([0, 1, 2]);
  expect(new Set(await page.locator('.notice-title').allTextContents()).size).toBe(18);
});

test('스크롤 실패는 목록을 보존하고 같은 페이지를 재시도한다', async ({ page }) => {
  await isolatedCommunity(page);
  await page.setViewportSize({ width: 900, height: 450 });
  const pages = [];
  let failed = false;
  await page.route('**/api/announce?*', route => {
    const current = Number(new URL(route.request().url()).searchParams.get('page'));
    pages.push(current);
    if (current === 1 && !failed) {
      failed = true;
      return route.fulfill({ status: 503, json: { message: 'temporary failure' } });
    }
    return route.fulfill({ json: { content: current === 0
      ? Array.from({ length: 8 }, (_, i) => announcementFixture(i + 1))
      : [announcementFixture(9, '재시도 성공 공고')], last: current === 1 } });
  });
  await page.goto('/');
  await expect(page.locator('.notice-title')).toHaveCount(8);
  await page.locator('[data-test="list-end"]').scrollIntoViewIfNeeded();
  await expect(page.getByRole('alert')).toContainText('불러오지 못했습니다');
  await expect(page.locator('.notice-title')).toHaveCount(8);
  await page.getByRole('button', { name: '재시도' }).click();
  await expect(page.locator('.notice-title')).toHaveCount(9);
  expect(pages).toEqual([0, 1, 1]);
});

test('스크롤 중 필터 변경은 첫 페이지부터 조회하고 늦은 이전 페이지를 버린다', async ({ page }) => {
  await isolatedCommunity(page);
  await page.setViewportSize({ width: 900, height: 450 });
  let releaseOld;
  const requests = [];
  await page.route('**/api/announce?*', async route => {
    const query = new URL(route.request().url()).searchParams;
    const current = Number(query.get('page'));
    const type = query.get('announcementType');
    requests.push([type, current]);
    if (type === 'EDU') return route.fulfill({ json: { content: [announcementFixture(99, '새 교육 공고')], last: true } });
    if (current === 1) {
      await new Promise(resolve => { releaseOld = resolve; });
      return route.fulfill({ json: { content: [announcementFixture(10, '늦은 이전 공고')], last: true } });
    }
    return route.fulfill({ json: { content: Array.from({ length: 8 }, (_, i) => announcementFixture(i + 1)), last: false } });
  });
  await page.goto('/');
  await expect(page.locator('.notice-title')).toHaveCount(8);
  await page.locator('[data-test="list-end"]').scrollIntoViewIfNeeded();
  await expect.poll(() => Boolean(releaseOld)).toBe(true);
  await page.locator('#edu').check();
  await expect(page.locator('.notice-title')).toHaveText('새 교육 공고');
  const oldResponse = page.waitForResponse(response => new URL(response.url()).searchParams.get('page') === '1');
  releaseOld();
  await oldResponse;
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await expect(page.locator('.notice-title')).toHaveText('새 교육 공고');
  expect(requests).toEqual([['', 0], ['', 1], ['EDU', 0]]);
});

test('모바일 교육 필터는 URL·새로고침·뒤로 가기에서 복원된다', async ({ page }) => {
  await isolatedCommunity(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const requests = [];
  await page.route('**/api/announce?*', route => {
    const query = new URL(route.request().url()).searchParams;
    requests.push(Object.fromEntries(query));
    return route.fulfill({ json: { content: [{ ...announcementFixture(90, '무료 백엔드 교육'), company: '교육기관', announcementType: 'EDU', payment: 0, deadLineDate: '2026-12-31T18:00:00' }], last: true } });
  });
  await page.goto('/?type=EDU&positions=BACKEND&languages=JAVA,SPRING&status=OPEN&tuition=FREE&q=교육');
  await expect(page.locator('.notice-title')).toHaveText('무료 백엔드 교육');
  expect(requests[0]).toMatchObject({ announcementType: 'EDU', positions: 'BACKEND', languages: 'JAVA,SPRING', recruitmentStatus: 'OPEN', tuition: 'FREE', title: '교육', page: '0' });
  await page.getByRole('button', { name: '필터 열기' }).click();
  await expect(page.getByRole('combobox', { name: '교육비' })).toHaveValue('FREE');
  await expect(page.getByRole('combobox', { name: '내 경력' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Java 조건 해제', exact: true }).click();
  await expect(page).toHaveURL(/languages=SPRING/);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Spring 조건 해제', exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('button', { name: 'Java 조건 해제', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: '전체 조건 초기화' }).click();
  await expect(page).toHaveURL('/?type=EDU');
});
