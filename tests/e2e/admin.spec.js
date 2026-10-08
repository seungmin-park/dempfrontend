import { test, expect } from './fixtures';

async function adminFixture(page, role = 'admin') {
  const state = { role, expired: false, items: [], histories: {}, reports: [], nextId: 10, post: { id: 5, questionId: 5, title: '기존 질문', content: '<h2>기존 HTML</h2><p><u>보존할 밑줄</u></p>', username: 'author', hashtags: ['JAVA'] } };
  if (role !== 'guest') await page.addInitScript(() => localStorage.setItem('vuex', JSON.stringify({ Login: { username: 'fixture', token: 'fixture-token', roles: ['ROLE_ADMIN'] } })));
  await page.route(/^https:\/\//, route => route.abort());
  await page.route('/api/**', async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname, method = request.method();
    const reply = (status, data) => route.fulfill({ status, contentType: 'application/json', body: status === 204 ? '' : JSON.stringify(data) });
    if (path.startsWith('/api/announce/detail/')) { const item = state.items.find(item => item.id === Number(path.split('/').pop()) && item.publicationStatus === 'PUBLISHED'); return reply(item ? 200 : 404, item || {}); }
    if (path === '/api/announce/scroll') return reply(200, []);
    if (!path.startsWith('/api/admin')) return reply(200, { content: [], number: 0, last: true });
    if (state.expired || state.role === 'guest') return reply(401, {});
    if (state.role !== 'admin') return reply(403, {});
    if (path === '/api/admin/me') return reply(200, { id: 1, username: 'fixture' });
    if (path === '/api/admin/announcement-reports') return reply(200, { content: state.reports.filter(item => url.searchParams.get('all') === 'true' || !item.resolvedAt), last: true, number: 0 });
    const report = path.match(/^\/api\/admin\/announcement-reports\/(\d+)$/);
    if (report && method === 'PATCH') {
      const item = state.reports.find(item => item.id === Number(report[1]));
      if (!item) return reply(404, {});
      Object.assign(item, { resolution: request.postDataJSON().note, resolvedAt: '2026-10-08T19:00:00', resolvedBy: 'fixture' });
      return reply(204);
    }
    if (path === '/api/admin/overview') return reply(200, { announcements: state.items.length, bootcamps: 0, questions: 1, answers: 0, members: 2 });
    if (path === '/api/admin/announcements' && method === 'GET') return reply(200, { content: state.items.map(item => ({ ...item, company: item.company.name })), last: true, number: 0 });
    const history = path.match(/\/announcements\/(\d+)\/history$/);
    if (history) return reply(200, state.histories[Number(history[1])] || []);
    if (path.includes('/announcements') && ['POST','PATCH'].includes(method)) {
      const body = request.postData() || '';
      const value = name => [...body.matchAll(new RegExp(`name="${name}"\\r?\\n\\r?\\n([\\s\\S]*?)\\r?\\n--`, 'g'))].map(match => match[1]);
      const fields = Object.fromEntries(['publicationStatus','sourceName','applicationUrl','recruitmentAudience','cohort','stipendNote','title','content','accessUrl','position','startedDate','deadLineDate','minCareer','maxCareer','payment'].map(name => [name, value(name)[0]]));
      for (const key of ['minCareer','maxCareer']) fields[key] = Number(fields[key]);
      fields.payment = value('payment').length ? Number(value('payment')[0]) : null;
      fields.recruitmentClosed = value('recruitmentClosed')[0] === 'true';
      fields.employmentType = value('type')[0] === 'EMP' ? value('employmentType')[0] || null : null;
      fields.sourceVerifiedAt = value('sourceVerified')[0] === 'true' ? '2026-09-27T12:00:00' : null;
      fields.stipendAmount = value('stipendAmount').length ? Number(value('stipendAmount')[0]) : null;
      fields.salaryStatus = value('salaryStatus')[0];
      fields.salaryMax = value('salaryMax').length ? Number(value('salaryMax')[0]) : null;
      fields.education = value('type')[0] === 'EDU' ? Object.fromEntries(['deliveryMode','region','commitment','fundingType','selectionProcess','learningLevel','learningStartDate','learningEndDate'].map(key => [key, value(key)[0] || null])) : null;
      const id = method === 'POST' ? state.nextId++ : Number(path.split('/').pop());
      fields.content = fields.content.replaceAll('attachment:0', '/fixture-body.png');
      const item = { ...fields, id, company: { name: value('company')[0] }, announcementType: value('type')[0], language: value('language'), image: '' };
      state.items = [...state.items.filter(row => row.id !== id), item];
      state.histories[id] = [...(state.histories[id] || []), { changedAt: '2026-10-07T18:03:00', actor: 'fixture', status: item.publicationStatus, title: item.title, sourceUrl: item.accessUrl }];
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
  await expect(page.locator('.site-footer a[href="/admin"]')).toHaveCount(0);
});

test('localStorage 관리자 역할을 넣어도 일반 회원은 운영 화면을 볼 수 없다', async ({ page }) => {
  await adminFixture(page, 'member'); await page.goto('/admin');
  await expect(page.getByRole('alert')).toContainText('관리자 권한');
  await expect(page.locator('.admin-stats')).toHaveCount(0);
  await expect(page.locator('.site-footer a[href="/admin"]')).toHaveCount(0);
});

test('모바일 관리자는 공고 등록 수정 재조회 삭제 확인을 진행한다', async ({ page }) => {
  const state = await adminFixture(page); await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/announcements');
  await expect(page.locator('.site-footer a[href="/admin"]')).toBeVisible();
  await page.getByRole('link', { name: '공고 등록', exact: true }).click();
  await page.getByRole('textbox', { name: '제목', exact: true }).fill('새 관리자 공고');
  await page.getByLabel('회사·교육기관').fill('DEMP 교육');
  await page.getByLabel('원문 공고 URL').fill('https://example.test/apply');
  await page.getByLabel('공고 종류', { exact: true }).selectOption('EDU');
  await page.getByLabel('분야', { exact: true }).selectOption('BACKEND');
  await page.getByLabel('모집 시작', { exact: true }).fill('2026-09-01T09:00');
  await page.getByLabel('모집 마감', { exact: true }).fill('2026-12-31T18:00');
  await page.getByLabel('Java', { exact: true }).check();
  await page.getByLabel('Spring', { exact: true }).check();
  await page.locator('#admin-image').setInputFiles({ name: 'fixture.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/F9sAAAAASUVORK5CYII=', 'base64') });
  await page.getByLabel('수업 방식', { exact: true }).selectOption('ONLINE');
  await page.getByLabel('참여 시간', { exact: true }).selectOption('PART_TIME');
  await page.getByLabel('교육비 지원', { exact: true }).selectOption('CARD_REQUIRED');
  await page.getByLabel('교육 시작일', { exact: true }).fill('2026-10-01');
  await page.getByLabel('교육 종료일', { exact: true }).fill('2026-12-31');
  await page.locator('#admin-content').fill('교육 소개: Java와 Spring');
  await page.getByRole('button', { name: '등록하기' }).click();
  await expect(page).toHaveURL(/\/admin\/announcements$/);
  expect(state.items[0].content).toContain('교육 소개: Java와 Spring');
  await page.getByRole('link', { name: '새 관리자 공고', exact: true }).click();
  await expect(page.locator('#admin-content')).toContainText('교육 소개: Java와 Spring');
  await expect(page.getByLabel('수업 방식', { exact: true })).toHaveValue('ONLINE');
  await expect(page.getByLabel('교육 시작일', { exact: true })).toHaveValue('2026-10-01');
  expect(state.items[0].payment).toBeNull();
  await page.getByRole('textbox', { name: '제목', exact: true }).fill('수정 관리자 공고');
  await page.locator('#admin-content').fill('수정 교육');
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

for (const width of [320, 390, 1440]) {
  test(`제보 처리 입력은 ${width}px에서 필드 오류·내용 저장·처리 결과를 유지한다`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const state = await adminFixture(page);
    state.reports = [{ id: 7, announcementId: 10, title: '제보 확인 공고', message: '마감일이 다릅니다.', reporter: 'fixture-member', createdAt: '2026-10-08T12:00:00' }];
    await page.goto('/admin/announcement-reports');
    await page.getByRole('button', { name: '처리 완료', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('처리 내용을 입력해 주세요.');
    const input = page.getByLabel('제보 처리 내용');
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(await page.locator('form').evaluate(element => element.noValidate)).toBe(true);
    expect((await input.boundingBox()).height).toBeGreaterThanOrEqual(128);
    expect(await page.locator('.report-review-card').evaluate(element => getComputedStyle(element).textAlign)).toBe('left');
    const footer = await page.locator('.feedback-input-footer').boundingBox();
    const actions = await page.locator('.feedback-actions').boundingBox();
    expect(actions.y - footer.y - footer.height).toBeGreaterThanOrEqual(15);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await input.fill('원문 확인 후 마감일을 수정했습니다.');
    await expect(page.getByRole('alert')).toHaveCount(0);
    await page.getByRole('button', { name: '처리 완료', exact: true }).click();
    await expect(page.getByText('미처리 제보가 없습니다.', { exact: true })).toBeVisible();
    await page.getByLabel('처리 완료 포함').check();
    await expect(page.getByText('원문 확인 후 마감일을 수정했습니다.', { exact: true })).toBeVisible();
    await expect(input).toHaveCount(0);
  });
  test(`관리자 폼과 앱 달력은 ${width}px에서 입력 그룹·날짜 선택·키보드·화면 경계를 유지한다`, async ({ page }) => {
    const state = await adminFixture(page);
    state.items = [{ id: 10, title: '달력 검증 공고', company: { name: 'DEMP' }, announcementType: 'EMP', publicationStatus: 'PUBLISHED', language: ['JAVA'], content: '<p>본문</p>', minCareer: 0, maxCareer: 0, position: 'BACKEND', accessUrl: 'https://example.test/calendar', startedDate: '2026-10-07T09:15:30', deadLineDate: '2026-10-31T18:00:45' }];
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/admin/announcements/10');
    await expect(page.locator('form > fieldset > legend')).toHaveText(['기본 정보', '모집 조건·일정', '공고 내용', '출처·지원', '게시 설정']);
    expect(await page.locator('form select').evaluateAll(controls => controls.every(control => control.getBoundingClientRect().height >= 44))).toBe(true);
    const trigger = page.getByRole('button', { name: '모집 시작 달력 열기', exact: true });
    await trigger.click();
    const calendar = page.getByRole('dialog', { name: '모집 시작 날짜 선택', exact: true });
    await expect(calendar.getByRole('button', { name: '2026년 10월 7일', exact: true })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(calendar.getByRole('button', { name: '2026년 10월 8일', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(calendar).toHaveCount(0);
    await trigger.click();
    await calendar.getByRole('button', { name: '다음 달', exact: true }).click();
    await expect(calendar.getByRole('button', { name: '2026년 11월 7일', exact: true })).toBeFocused();
    await calendar.getByRole('button', { name: '이전 달', exact: true }).click();
    const box = await calendar.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(width);
    if (width > 480) { expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y + box.height).toBeLessThanOrEqual(900); }
    await calendar.getByRole('button', { name: '2026년 10월 8일', exact: true }).click();
    await expect(page.getByLabel('모집 시작', { exact: true })).toHaveValue('2026-10-08T09:15');
    await page.getByRole('button', { name: '변경 저장', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/announcements$/);
    expect(state.items[0].startedDate).toBe('2026-10-08T09:15');
    expect(state.items[0].deadLineDate).toBe('2026-10-31T18:00:45');
    await page.goto('/admin/announcements/10');
    await expect(page.getByLabel('모집 시작', { exact: true })).toHaveValue('2026-10-08T09:15');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test(`변경 이력은 ${width}px에서 순서와 값을 보존하고 제목을 다음 줄에 정렬한다`, async ({ page }) => {
    const state = await adminFixture(page);
    await page.setViewportSize({ width, height: 900 });
    state.items = [{ id: 10, title: '긴 공고 제목', company: { name: 'DEMP' }, announcementType: 'EMP', publicationStatus: 'PUBLISHED', language: ['JAVA'], content: '<p>본문</p>', startedDate: '2026-10-01T09:00:00', deadLineDate: '2026-10-31T18:00:00' }];
    state.histories[10] = [
      { changedAt: '2026-10-07T18:00:00', actor: 'fixture', status: 'REVIEW', title: '전환형 인턴 모집 공고의 아주 긴 제목입니다', sourceUrl: 'https://example.test/job' },
      { changedAt: '2026-10-07T18:03:00', actor: 'fixture', status: 'PUBLISHED', title: '수정 후 게시한 공고 제목입니다', sourceUrl: 'https://example.test/job' },
    ];
    await page.goto('/admin/announcements/10');
    await page.getByRole('button', { name: '이력 보기', exact: true }).click();
    const rows = page.getByRole('list', { name: '공고 변경 이력' }).getByRole('listitem');
    await expect(rows).toHaveCount(2);
    for (const [index, entry] of state.histories[10].entries()) {
      await expect(rows.nth(index).locator('time')).toHaveAttribute('datetime', entry.changedAt);
      await expect(rows.nth(index).locator('.history-actor')).toHaveText(entry.actor);
      await expect(rows.nth(index).locator('.history-title')).toHaveText(entry.title);
    }
    await expect(rows.nth(0).locator('.history-status')).toHaveText('검토 중');
    await expect(rows.nth(1).locator('.history-status')).toHaveText('공개');
    expect(await rows.evaluateAll(items => items.every(item => {
      const meta = item.querySelector('.history-meta').getBoundingClientRect();
      const title = item.querySelector('.history-title').getBoundingClientRect();
      return title.top - meta.bottom >= 8 && Math.abs(title.left - meta.left) < 1 && getComputedStyle(item).textAlign === 'left';
    }))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

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


test('본문 붙여넣기와 이미지 저장 후 재조회하고 지원하기는 원문을 새 탭으로 연다', async ({ page }) => {
  const state = await adminFixture(page);
  await page.route('**/fixture-body.png', route => route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/F9sAAAAASUVORK5CYII=', 'base64') }));
  await page.context().route('**/original-employer-job', route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<meta charset="utf-8"><h1>기업 원문 공고</h1>' }));
  await page.goto('/admin/announcements/new');
  await page.getByLabel('제목', { exact: true }).fill('원문 연결 공고');
  await page.getByLabel('게시 상태', { exact: true }).selectOption('PUBLISHED');
  await page.getByLabel('회사·교육기관').fill('DEMP');
  const employerURL = new URL('/original-employer-job', page.url()).href;
  await page.getByLabel('원문 공고 URL').fill(employerURL);
  await page.getByLabel('분야', { exact: true }).selectOption('BACKEND');
  await page.getByLabel('모집 시작', { exact: true }).fill('2026-09-01T09:00');
  await page.getByLabel('모집 마감', { exact: true }).fill('2026-12-31T18:00');
  await page.getByLabel('Java', { exact: true }).check();
  await page.locator('#admin-content').focus();
  await page.locator('#admin-content').evaluate(element => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/html', '<h2 style="color:red">주요 업무</h2><ul><li>Java 개발</li></ul><img src="https://untrusted.test/remote.png"><script>bad()</script>');
    clipboardData.setData('text/plain', '주요 업무\nJava 개발');
    element.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }));
  });
  await expect(page.locator('#admin-content h2')).toHaveText('주요 업무');
  await expect(page.locator('#admin-content li')).toHaveText('Java 개발');
  await expect(page.locator('#admin-content img')).toHaveCount(0);
  await expect(page.locator('#admin-content [style], #admin-content script')).toHaveCount(0);
  await page.locator('#admin-content-images').setInputFiles({ name: 'poster.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/F9sAAAAASUVORK5CYII=', 'base64') });
  await expect(page.locator('#admin-content img')).toHaveCount(1);
  await page.getByRole('button', { name: '미리보기', exact: true }).click();
  await page.getByLabel('모바일 너비로 보기').check();
  await expect(page.locator('.body-preview img')).toBeVisible();
  await page.getByRole('button', { name: '등록하기', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/announcements$/);
  const id = state.items[0].id;
  await page.goto(`/admin/announcements/${id}`);
  await expect(page.locator('#admin-content h2')).toHaveText('주요 업무');
  await expect(page.locator('#admin-content img')).toHaveAttribute('src', '/fixture-body.png');
  await page.goto(`/detail/${id}`);
  await expect(page.locator('.detail-announce-content img')).toBeVisible();
  const opened = page.waitForEvent('popup');
  await page.getByRole('link', { name: '지원하기', exact: true }).click();
  const original = await opened;
  await expect(original).toHaveURL(employerURL);
  await expect(original.getByRole('heading')).toHaveText('기업 원문 공고');
  await original.close();
});

test('초안은 공개 상세에서 숨기고 검토 후 게시하며 수동 마감 상태를 보존한다', async ({ page }) => {
  const state = await adminFixture(page); await page.goto('/admin/announcements/new');
  await expect(page.getByLabel('게시 상태', { exact: true })).toHaveValue('DRAFT');
  await page.getByLabel('제목', { exact: true }).fill('게시 수명주기 검증');
  await page.getByLabel('회사·교육기관').fill('DEMP');
  await page.getByLabel('원문 공고 URL').fill('https://example.com/original');
  await page.getByLabel('출처 이름', { exact: true }).fill('회사 채용');
  await page.getByLabel('분야', { exact: true }).selectOption('BACKEND');
  await page.getByLabel('모집 대상', { exact: true }).selectOption('NEW');
  await page.getByLabel('고용 형태', { exact: true }).selectOption('CONVERSION_INTERNSHIP');
  await page.getByLabel('모집 시작', { exact: true }).fill('2026-09-01T09:00');
  await page.getByLabel('모집 마감', { exact: true }).fill('2026-12-31T18:00');
  await page.getByLabel('Java', { exact: true }).check();
  await page.locator('#admin-content').fill('원문 확인 요약');
  await page.getByRole('button', { name: '등록하기', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/announcements$/);
  const id = state.items[0].id;
  await page.goto(`/detail/${id}`); await expect(page.getByRole('alert')).toContainText('찾을 수 없습니다');
  for (const status of ['REVIEW', 'PUBLISHED']) {
    await page.goto(`/admin/announcements/${id}`);
    await expect(page.getByLabel('고용 형태', { exact: true })).toHaveValue('CONVERSION_INTERNSHIP');
    await page.getByLabel('게시 상태', { exact: true }).selectOption(status);
    await page.getByRole('button', { name: '변경 저장', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/announcements$/);
    expect(state.items[0].publicationStatus).toBe(status);
  }
  await page.goto(`/detail/${id}`); await expect(page.locator('.job-detail').getByLabel('모집 구분')).toHaveText('신입');
  await expect(page.locator('.job-detail').getByLabel('고용 형태')).toHaveText('전환형 인턴');
  await page.goto(`/admin/announcements/${id}`); await page.getByLabel('모집 종료 (수동 마감)').check();
  await page.getByRole('button', { name: '변경 저장', exact: true }).click(); await expect(page).toHaveURL(/\/admin\/announcements$/);
  await page.goto(`/detail/${id}`); await expect(page.getByRole('link', { name: '원문 확인', exact: true })).toBeVisible();
});
