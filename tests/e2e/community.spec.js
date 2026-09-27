const { test, expect } = require('@playwright/test');

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
  await page.addInitScript(() => {
    // Summernote is loaded from a CDN in production. The editor boundary is
    // replaced here so this suite never depends on the public network.
    window.$ = selector => ({
      summernote(option) {
        if (option === 'code') return document.querySelector(selector).value;
        return this;
      },
    });
  });
  await page.route(/^https:\/\//, route => route.abort());
  await page.route('**/api/**', async route => {
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
      return reply(200, 'ok');
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
      return reply(200, { content: emp === 'EDU' ? [] : [{ id: 71, title: '개발자 채용', language: ['JAVA'], position: 'BACKEND', image: '/fixture.png' }], last: true });
    }
    if (path === '/api/announce/detail/71') {
      if (!username || state.expired) return reply(401, { message: 'expired' });
      return reply(200, { id: 71, title: '개발자 채용', company: { name: '테스트 회사' }, announcementType: 'EMP', position: 'BACKEND', language: ['JAVA'], minCareer: 0, maxCareer: 0, startedDate: '2026-09-01T00:00:00', deadLineDate: '2026-10-01T00:00:00', content: '<p>안전한 공고</p><img src=x onerror="window.__xss = true">', accessUrl: '/apply', image: '/fixture.png' });
    }
    if (path === '/api/question/hashtags') return reply(200, []);
    if (path === '/api/question' && method === 'GET') {
      const title = url.searchParams.get('title') || '';
      const content = url.searchParams.get('content') || '';
      const questions = state.questions.filter(q => q.title.includes(title) && q.content.includes(content));
      return reply(200, { content: questions.map(({ id, title }) => ({ id, title, hits: 0, recommend: 0 })), number: 0, last: true, totalElements: questions.length });
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
      state.answers.push({ id: state.answers.length + 1, questionId: Number(form.questionId), username, content: form.answerContent, recommend: 0, dislike: 0 });
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
  await expect(page.getByText('테스트 회사')).toBeVisible();
  await page.getByRole('link', { name: '면접 질문' }).click();
  await page.getByRole('button', { name: '질문하기' }).click();
  await page.locator('#question-title').fill('독립 조회 질문');
  await page.locator('#content').fill('질문 본문');
  await page.getByRole('button', { name: '작성하기' }).click();
  await expect(page.locator('.question-list-title')).toHaveText('Q. 독립 조회 질문');
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
  await expect(page.locator('.question-list-title')).toHaveText('Q. 최신 질문');
  releaseOld();
  await expect(page.locator('.question-list-title')).toHaveText('Q. 최신 질문');
});
