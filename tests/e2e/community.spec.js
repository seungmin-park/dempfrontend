import { test, expect } from './fixtures';

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
    reactions: new Map(),
  };
  const reactionState = (target, id, username) => {
    const prefix = `${target}:${id}:`;
    const votes = [...state.reactions.entries()].filter(([key]) => key.startsWith(prefix)).map(([, value]) => value);
    return { recommend: votes.filter(value => value === 'RECOMMEND').length, dislike: votes.filter(value => value === 'DISLIKE').length,
      myReaction: state.reactions.get(`${prefix}${username}`) || 'NONE' };
  };
  await page.route(/^https:\/\//, route => route.abort());
  await page.route('/api/**', async route => {
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
    const reaction = path.match(/^\/api\/(question|answer)\/(\d+)\/reaction$/);
    if (reaction && method === 'PUT') {
      if (!username || state.expired) return reply(401, {});
      const [, target, id] = reaction;
      state.reactions.set(`${target}:${id}:${username}`, request.postDataJSON().reaction);
      return reply(200, reactionState(target, id, username));
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
      return question ? reply(200, { ...question, hits: 1, ...reactionState('question', question.id, username) }) : reply(404, {});
    }
    if (path === '/api/question/update' && method === 'PATCH') {
      if (!username || state.expired) return reply(401, {});
      const form = request.postDataJSON();
      const question = state.questions.find(q => q.id === Number(form.questionId));
      if (!question || question.username !== username) return reply(403, {});
      Object.assign(question, { title: form.title, content: form.content, hashtags: form.hashtags });
      return reply(200, {});
    }
    const answerList = path.match(/^\/api\/answer\/(\d+)$/);
    if (answerList) {
      const before = url.searchParams.get('before');
      const window = state.answers.filter(a => a.questionId === Number(answerList[1]) && (before === null || a.answerId < Number(before)))
        .sort((a, b) => b.answerId - a.answerId).slice(0, 21);
      const content = window.slice(0, 20).map(answer => ({ ...answer, answerId: String(answer.answerId), ...reactionState('answer', answer.answerId, username) }));
      return reply(200, { content, hasNext: window.length > 20, nextCursor: window.length > 20 ? String(content.at(-1).answerId) : null });
    }
    if (path === '/api/answer/save' && method === 'POST') {
      if (!username || state.expired) return reply(401, { message: 'expired' });
      const form = request.postDataJSON();
      state.answers.push({ answerId: state.answers.length + 1, questionId: Number(form.questionId), username, content: form.answerContent, recommend: 0, dislike: 0 });
      const created = state.answers.at(-1);
      return reply(200, { ...created, answerId: String(created.answerId), myReaction: 'NONE' });
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

async function answerPageFixture(page) {
  const state = await isolatedCommunity(page);
  state.questions.push({ id: 7, title: '페이지 질문', content: '<p>본문</p>', username: 'member', hashtags: [] });
  state.answers = Array.from({ length: 26 }, (_, index) => ({ answerId: index + 1, questionId: 7, username: 'member',
    content: `기존 답변 ${index + 1}`, recommend: 0, dislike: 0 }));
  await loginAs(page, state, 'member');
  await page.goto('/questions/7');
  return state;
}

test('답변 20개 조회 후 더 보기와 단건 저장을 함께 진행한다', async ({ page }) => {
  const state = await answerPageFixture(page);
  await expect(page.locator('.question-answer')).toHaveCount(20);
  let releaseMore;
  const hold = new Promise(resolve => { releaseMore = resolve; });
  let moreStarted = false;
  await page.route('**/api/answer/7?before=*', async route => { moreStarted = true; await hold; await route.fallback(); });
  await page.locator('[data-test="answer-load-more"]').click();
  await expect.poll(() => moreStarted).toBe(true);
  await page.locator('#answer').fill('추가 답변');
  await page.getByRole('button', { name: '댓글 달기' }).click();
  await expect(page.locator('.question-answer')).toHaveCount(21);
  await expect(page.locator('#answer')).toHaveValue('');
  releaseMore();
  await expect(page.locator('.question-answer')).toHaveCount(27);
  await expect(page.locator('[data-test="answer-load-more"]')).toHaveCount(0);
  await expect(page.getByText('표시된 답변 27개')).toBeVisible();
  const created = page.locator('.question-answer').first();
  await expect(created).toContainText('추가 답변');
  await created.getByRole('button', { name: /^비추천/ }).click();
  await expect(created.getByRole('button', { name: /^비추천/ })).toHaveAttribute('aria-pressed', 'true');
  expect(state.answers).toHaveLength(27);
  await page.reload();
  await expect(page.locator('.question-answer')).toHaveCount(20);
  await expect(page.locator('.question-answer').first()).toContainText('추가 답변');
  await expect(page.locator('.question-answer').first().getByRole('button', { name: /^비추천/ })).toHaveAttribute('aria-pressed', 'true');
});

test('답변 더 보기 실패는 목록과 작성 입력을 보존한다', async ({ page }) => {
  await answerPageFixture(page);
  await expect(page.locator('.question-answer')).toHaveCount(20);
  await page.locator('#answer').fill('작성 중인 답변');
  const cursors = [];
  await page.route('**/api/answer/7?before=*', async route => {
    cursors.push(new URL(route.request().url()).searchParams.get('before'));
    if (cursors.length === 1) await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    else await route.fallback();
  });
  await page.locator('[data-test="answer-load-more"]').click();
  await expect(page.locator('[data-test="answer-more-error"]')).toContainText('불러오지 못했습니다');
  await expect(page.locator('.question-answer')).toHaveCount(20);
  await expect(page.locator('#answer')).toHaveValue('작성 중인 답변');
  await page.locator('[data-test="answer-load-more"]').click();
  await expect(page.locator('.question-answer')).toHaveCount(26);
  await expect(page.locator('#answer')).toHaveValue('작성 중인 답변');
  expect(cursors).toEqual(['7', '7']);
  await expect(page.locator('[data-test="answer-load-more"]')).toHaveCount(0);
});

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
  await expect(page).toHaveURL('/detail/71?type=EMP');
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

test('본인 질문은 태그와 서식을 편집해 재조회하고 타인 편집 화면은 숨긴다', async ({ page }) => {
  const state = await isolatedCommunity(page);
  state.questions.push({ id: 1, title: '본인 질문', content: '<h2>원본 제목</h2><p><u>밑줄</u></p>', username: 'writer', hashtags: ['Docker'] });
  await loginAs(page, state, 'writer'); await page.goto('/questions/1');
  await page.getByRole('link', { name: '질문 편집', exact: true }).click();
  await expect(page.locator('#question-title')).toHaveValue('본인 질문');
  await expect(page.locator('#content')).toHaveValue(/## 원본 제목/);
  await page.locator('#question-title').fill('편집한 본인 질문');
  await page.locator('#content').fill('## 편집 제목\n\n<u>밑줄</u>');
  await page.getByLabel('태그 입력', { exact: true }).fill('JAVA');
  await page.getByLabel('태그 입력', { exact: true }).press('Enter');
  await page.getByRole('button', { name: '변경 저장', exact: true }).click();
  await expect(page).toHaveURL('/questions/1'); await page.reload();
  await expect(page.getByRole('heading', { name: '편집한 본인 질문' })).toBeVisible();
  await expect(page.locator('.article-content h2')).toHaveText('편집 제목');
  await expect(page.locator('.article-content u')).toHaveText('밑줄');
  await expect(page.locator('.tag-list a')).toHaveText(['#Docker', '#JAVA']);
  expect(state.questions[0].username).toBe('writer');
  await loginAs(page, state, 'reader'); await page.goto('/questions/1');
  await expect(page.getByRole('link', { name: '질문 편집', exact: true })).toHaveCount(0);
  await page.goto('/questions/1/edit');
  await expect(page.getByRole('alert')).toContainText('본인');
  await expect(page.locator('.write-form')).toHaveCount(0);
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
  await expect(page.getByText('현재 조건의 공고를 모두 확인했습니다.')).toBeVisible();
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


test('없는 페이지·상세 오류는 안내하고 재시도로 복구된다', async ({ page }) => {
  const state = await isolatedCommunity(page);
  await page.goto('/missing-page');
  await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없습니다.' })).toBeVisible();
  await page.getByRole('link', { name: '공고 둘러보기' }).click();
  await expect(page).toHaveURL('/');
  await loginAs(page, state, 'reader');
  let failed = false;
  await page.route('**/api/announce/detail/71', route => {
    if (!failed) { failed = true; return route.fulfill({ status: 503, json: {} }); }
    return route.fulfill({ json: { title: '복구 공고', company: { name: '회사' }, announcementType: 'EMP', language: ['JAVA', 'SPRING'], minCareer: 0, maxCareer: 3, content: '<p>복구 본문</p>', accessUrl: 'https://example.com', startedDate: '2026-09-01T09:00:00', deadLineDate: '2026-12-31T18:30:00' } });
  });
  await page.goto('/detail/71?type=EDU&tuition=FREE');
  await expect(page.locator('.details-announcement').getByRole('alert')).toContainText('불러오지 못했습니다');
  await page.locator('.details-announcement').getByRole('button', { name: '재시도' }).click();
  await expect(page.getByRole('heading', { name: '복구 공고' })).toBeVisible();
  await expect(page.locator('[aria-label="기술 스택"]')).toHaveText('Java, Spring');
  await expect(page.locator('.detail-facts')).toContainText('2026.12.31 18:30');
  await page.getByRole('button', { name: '검색 결과로 돌아가기' }).click();
  await expect(page).toHaveURL('/?type=EDU&tuition=FREE');
});

test('모집 구분은 모바일 카드와 상세·관련 공고에서 연차와 함께 구별된다', async ({ page }) => {
  const state = await isolatedCommunity(page);
  await loginAs(page, state, 'audience-reader');
  const items = [
    { id: 1, title: '경력 무관 채용', announcementType: 'EMP', minCareer: 0, maxCareer: 0 },
    { id: 2, title: '신입 지원 가능 채용', announcementType: 'EMP', minCareer: 0, maxCareer: 3 },
    { id: 3, title: '경력 개발자 채용', announcementType: 'EMP', minCareer: 3, maxCareer: 5 },
    { id: 4, title: '백엔드 부트캠프', announcementType: 'EDU', minCareer: 0, maxCareer: 0 },
  ].map(item => ({ ...item, company: null, image: '', language: ['JAVA', 'SPRING'], content: '공고 설명' }));
  await page.route('**/api/announce', route => route.fulfill({ json: { content: items, last: true } }));
  await page.route('**/api/announce?*', route => route.fulfill({ json: { content: items, last: true } }));
  await page.route('**/api/announce/scroll', route => route.fulfill({ json: items }));
  await page.route('**/api/announce/detail/3', route => route.fulfill({ json: items[2] }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.job-card [aria-label="모집 구분"]')).toHaveText(['경력 무관', '신입·경력', '경력', '교육']);
  await expect(page.locator('.job-card').nth(1)).toContainText('3년 이하');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', { name: '경력 개발자 채용', exact: true }).click();
  await expect(page.locator('.job-detail-heading .announcement-audience')).toHaveText('경력3~5년');
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.locator('.anncoucement-scroll [aria-label="모집 구분"]')).toHaveText(['경력 무관', '신입·경력', '경력', '교육']);
});

test('교육 빈 검색은 상황을 설명하고 필터 해제로 교육 목록을 복구한다', async ({ page }) => {
  await isolatedCommunity(page);
  await page.route('**/api/announce?*', route => {
    const query = new URL(route.request().url()).searchParams;
    return route.fulfill({ json: { content: query.get('title') || query.get('tuition') ? [] : [{ id: 4, title: '복구된 교육과정', announcementType: 'EDU', language: [] }], last: true } });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?type=EDU&tuition=FREE');
  await expect(page.locator('.empty-state h2')).toHaveText('선택한 조건에 맞는 부트캠프·교육과정이 없습니다.');
  await expect(page.locator('[data-test="retry"]')).toHaveCount(0);
  await page.getByRole('textbox', { name: '공고 검색어' }).fill('없는 과정');
  await page.getByRole('button', { name: '검색', exact: true }).click();
  await expect(page.locator('.empty-state h2')).toHaveText('“없는 과정”에 해당하는 부트캠프·교육과정이 없습니다.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: '검색·필터 해제' }).click();
  await expect(page).toHaveURL('/?type=EDU');
  await expect(page.locator('.notice-title')).toHaveText('복구된 교육과정');
  await expect(page.getByRole('textbox', { name: '공고 검색어' })).toHaveValue('');
});


test('상세 교육 필터는 모바일 입력·새로고침·뒤로가기·빈 결과 해제에 연동된다', async ({ page }) => {
  await isolatedCommunity(page); await page.setViewportSize({ width: 390, height: 844 });
  const requests = [];
  await page.route('**/api/announce?*', route => {
    const query = new URL(route.request().url()).searchParams; requests.push(Object.fromEntries(query));
    return route.fulfill({ json: { content: [], last: true } });
  });
  await page.goto('/?type=EDU');
  await page.getByRole('button', { name: '필터 열기' }).click();
  await page.locator('.education-filter-panel summary').click();
  await page.getByLabel('수업 방식', { exact: true }).selectOption('ONLINE');
  await page.getByLabel('참여 시간', { exact: true }).selectOption('PART_TIME');
  await page.getByLabel('교육비 지원', { exact: true }).selectOption('CARD_REQUIRED');
  await page.getByLabel('개강일 이후', { exact: true }).fill('2026-10-01');
  await page.getByLabel('개강일 이후', { exact: true }).press('Tab');
  await expect.poll(() => requests.at(-1)).toMatchObject({ deliveryMode: 'ONLINE', commitment: 'PART_TIME', fundingType: 'CARD_REQUIRED', startAfter: '2026-10-01', page: '0' });
  await expect(page.locator('.empty-state h2')).toHaveText('선택한 조건에 맞는 부트캠프·교육과정이 없습니다.');
  await page.reload();
  await expect(page.getByRole('button', { name: '온라인 조건 해제', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '온라인 조건 해제', exact: true }).click();
  await expect(page).not.toHaveURL(/deliveryMode/);
  await page.goBack(); await expect(page).toHaveURL(/deliveryMode=ONLINE/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: '검색·필터 해제' }).click();
  await expect(page).toHaveURL('/?type=EDU');
  await page.goto('/?type=EMP&payment=5000');
  await expect(page.getByLabel('최소 연봉')).toHaveCount(0);
  expect(requests.at(-1).payment).toBeUndefined();
});

test('질문·답변 반응 저장과 취소는 새로고침 후에도 유지된다', async ({ page }) => {
  const state = await isolatedCommunity(page);
  state.questions.push({ id: 1, title: '반응 QA 질문', content: '질문 내용', username: 'writer', hashtags: [] });
  state.answers.push({ answerId: 1, questionId: 1, content: '반응 QA 답변', username: 'writer', recommend: 0, dislike: 0 });
  await loginAs(page, state, 'voter');
  await page.goto('/questions/1');
  const question = page.locator('.question-detail .content-reactions');
  const answer = page.locator('.question-answer .content-reactions');
  await question.getByRole('button', { name: '추천 0', exact: true }).click();
  await expect(question.getByRole('button', { name: '추천 1', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await question.getByRole('button', { name: '비추천 0', exact: true }).click();
  await expect(question.getByRole('button', { name: '추천 0', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await answer.getByRole('button', { name: '추천 0', exact: true }).click();
  await expect(answer.getByRole('button', { name: '추천 1', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(question.getByRole('button', { name: '비추천 1', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(answer.getByRole('button', { name: '추천 1', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await question.getByRole('button', { name: '비추천 1', exact: true }).click();
  await expect(question.getByRole('button', { name: '비추천 0', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await page.reload();
  await expect(question.getByRole('button', { name: '비추천 0', exact: true })).toHaveAttribute('aria-pressed', 'false');
});


test('로그인 제한은 대기 시간을 표시하고 입력을 보존해 재시도한다', async ({ page }) => {
  await isolatedCommunity(page);
  let attempt = 0;
  await page.route('/api/member/login', route => {
    attempt++;
    return route.fulfill({ status: attempt === 1 ? 429 : 200,
      contentType: 'application/json', headers: attempt === 1 ? { 'Retry-After': '125' } : {},
      body: JSON.stringify(attempt === 1 ? { errorCode: 429, errorMessage: 'Too many requests' }
        : { jwt: 'retry-token', username: 'retry-member' }) });
  });
  await page.goto('/login');
  await page.locator('#username').fill('retry-member');
  await page.locator('#password').fill('password');
  await page.locator('form').getByRole('button', { name: '로그인' }).click();
  await expect(page.getByRole('alert')).toContainText('2분 5초 후');
  await expect(page).toHaveURL('/login');
  await expect(page.locator('#username')).toHaveValue('retry-member');
  await expect(page.locator('#password')).toHaveValue('password');
  await page.locator('form').getByRole('button', { name: '로그인' }).click();
  await expect(page).toHaveURL('/');
  expect(attempt).toBe(2);
});
