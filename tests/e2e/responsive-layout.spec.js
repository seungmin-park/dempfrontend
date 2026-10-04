import { test, expect } from './fixtures';

const widths = [320, 390, 640, 768, 1024, 1440];
const longText = '공백없는긴이름' + 'VeryLongCompanyAndSearchIdentifier'.repeat(4);

async function layoutFixture(page, authenticated = true) {
  if (authenticated) await page.addInitScript(() => localStorage.setItem('vuex', JSON.stringify({ Login: { username: '화면폭검증회원이름'.repeat(8), token: 'layout-fixture', roles: ['ROLE_ADMIN'] } })));
  await page.route('/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    const summary = { id: 71, title: longText, company: longText, announcementType: 'EMP', publicationStatus: 'PUBLISHED', language: ['JAVA', 'SPRING'], position: 'BACKEND', deadLineDate: '2026-12-31T18:00:00' };
    const detail = { ...summary, company: { name: longText }, recruitmentAudience: 'NEW', minCareer: 0, maxCareer: 0, startedDate: '2026-09-01T09:00:00', content: '<p>화면 비율과 무관하게 읽을 수 있는 공고 본문입니다.</p>', accessUrl: 'https://example.test/original' };
    let body;
    if (path === '/api/admin/me') body = { id: 1, username: 'layout-admin' };
    else if (path === '/api/admin/overview') body = { announcements: 1, bootcamps: 0, questions: 1, answers: 1, members: 2 };
    else if (path === '/api/announce/detail/71') body = detail;
    else if (path === '/api/announce/scroll') body = [detail];
    else if (path === '/api/announce' || path === '/api/admin/announcements') body = { content: [summary], number: 0, last: true };
    else if (path === '/api/question/hashtags') body = ['JAVA', 'SPRING'];
    else if (path === '/api/question/detail/71') body = { id: 71, title: '반응형 질문 상세', username: longText, content: '<p>질문 본문</p>', hashtags: ['JAVA', 'SPRING'], hits: 999999, recommend: 12, dislike: 0 };
    else if (path === '/api/question') body = { content: [{ id: 71, title: longText, hits: 999999, recommend: 999999 }], number: 0, last: true };
    else if (path === '/api/answer/71') body = [];
    else return route.fulfill({ status: 404, json: {} });
    return route.fulfill({ json: body });
  });
}

async function expectContained(page) {
  const overflow = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  expect.soft(overflow.document, '문서가 화면 폭을 넘어 가로로 스크롤되지 않아야 한다').toBeLessThanOrEqual(overflow.viewport);
  // Geometry selectors are deliberate: these assertions cover rendered spacing rather than internal state.
  const outside = await page.locator('main button, main input:not([type=hidden]), main select, main textarea, header a, header button').evaluateAll(elements => elements.filter(element => {
    const box = element.getBoundingClientRect();
    return box.width > 0 && box.height > 0 && (box.left < -1 || box.right > innerWidth + 1);
  }).map(element => ({ text: element.textContent?.trim(), label: element.getAttribute('aria-label'), width: element.getBoundingClientRect().width })));
  expect.soft(outside, '입력과 버튼은 화면 안에 보여야 한다').toEqual([]);
}

async function expectGap(first, second, minimum, axis = 'x') {
  const a = await first.boundingBox(), b = await second.boundingBox();
  expect(a).not.toBeNull(); expect(b).not.toBeNull();
  const gap = axis === 'y' ? b.y - a.y - a.height : b.x - a.x - a.width;
  expect.soft(gap, `요소 사이 ${axis} 간격`).toBeGreaterThanOrEqual(minimum - 1);
}

async function capture(page, testInfo) {
  const path = testInfo.outputPath('screen.png');
  await page.screenshot({ path, fullPage: true });
  await testInfo.attach('화면', { path, contentType: 'image/png' });
}

for (const width of widths) {
  test.describe(`${width}px 화면`, () => {
    test.use({ viewport: { width, height: 900 } });

    test(`${width}px: 공고 검색어와 모바일 필터는 읽을 폭과 버튼 간격을 유지한다`, async ({ page }, testInfo) => {
      await layoutFixture(page); await page.goto('/');
      await expect(page.locator('.notice-title')).toBeVisible();
      const search = page.getByLabel('공고 검색어');
      expect.soft((await search.boundingBox()).width, '검색어 입력 폭').toBeGreaterThanOrEqual(160);
      if (width <= 640) {
        await page.getByRole('button', { name: '필터 열기' }).click();
        await expectGap(page.getByRole('button', { name: '검색', exact: true }), page.getByRole('button', { name: '필터 열기' }), 8);
      }
      expect.soft((await page.getByLabel('모집 상태').boundingBox()).width, '필터의 선택 값이 읽히는 폭').toBeGreaterThanOrEqual(150);
      await page.getByText('직무·분야', { exact: true }).click();
      await expect(page.getByRole('checkbox', { name: '백엔드', exact: true })).toBeVisible();
      await expectContained(page); await capture(page, testInfo);
      await page.locator('.discovery-search').screenshot({ path: testInfo.outputPath('search.png') });
    });

    test(`${width}px: 긴 검색 조건과 카드 텍스트는 화면 밖으로 밀려나지 않는다`, async ({ page }, testInfo) => {
      await layoutFixture(page); await page.goto('/');
      await page.getByLabel('공고 검색어').fill(longText);
      await page.getByRole('button', { name: '검색', exact: true }).click();
      await expect(page.getByRole('button', { name: `${longText} 조건 해제` })).toBeVisible();
      await expectContained(page); await capture(page, testInfo);
    });

    test(`${width}px: 질문 목록의 검색과 페이지 이동 버튼은 읽을 폭과 간격을 유지한다`, async ({ page }, testInfo) => {
      await layoutFixture(page); await page.goto('/question');
      await expect(page.locator('.question-list-title')).toBeVisible();
      expect.soft((await page.getByLabel('질문 검색어').boundingBox()).width, '질문 검색어 입력 폭').toBeGreaterThanOrEqual(160);
      await expectGap(page.getByRole('button', { name: '해시태그', exact: true }), page.getByRole('button', { name: '질문하기' }), 8);
      await expectContained(page); await capture(page, testInfo);
    });

    test(`${width}px: 긴 작성자와 조회수는 겹치지 않고 태그와 반응 사이에 여백이 있다`, async ({ page }, testInfo) => {
      await layoutFixture(page); await page.goto('/questions/71');
      await expect(page.getByRole('heading', { name: '반응형 질문 상세' })).toBeVisible();
      await expectGap(page.locator('.article-meta .member-badge'), page.locator('.article-meta .meta-count'), 12);
      await expectGap(page.locator('.tag-list'), page.locator('.question-detail .reaction-control'), 20, 'y');
      await expectContained(page); await capture(page, testInfo);
    });

    test(`${width}px: 질문 편집기의 서식과 보기 버튼이 잘리지 않는다`, async ({ page }, testInfo) => {
      await layoutFixture(page); await page.goto('/questions/new');
      await expect(page.getByRole('button', { name: '코드 블록', exact: true })).toBeVisible();
      await page.getByRole('button', { name: '분할 보기', exact: true }).click();
      await expectContained(page); await capture(page, testInfo);
    });

    test(`${width}px: 공고 상세의 안내와 지원 버튼은 서로 붙지 않는다`, async ({ page }, testInfo) => {
      await layoutFixture(page); await page.goto('/detail/71');
      const apply = page.getByRole('link', { name: '지원하기', exact: true });
      await expect(apply).toBeVisible();
      await expect(page.locator('.anncoucement-scroll .item-company')).toBeVisible();
      const sidebarText = await page.locator('.anncoucement-scroll-items-description').evaluate(element => ({ rendered: element.clientWidth, content: element.scrollWidth }));
      expect.soft(sidebarText.content, '사이드바의 기관명과 공고 제목은 내부에서 가로로 넘치지 않는다').toBeLessThanOrEqual(sidebarText.rendered + 1);
      const note = page.locator('.apply-bar .field-hint');
      const a = await note.boundingBox(), b = await apply.boundingBox();
      const gap = b.y >= a.y + a.height - 1 ? b.y - a.y - a.height : b.x - a.x - a.width;
      expect.soft(gap, '지원 안내와 버튼 간격').toBeGreaterThanOrEqual(11);
      await expectContained(page); await capture(page, testInfo);
    });

    test(`${width}px: 짧은 질문 본문은 불필요한 고정 높이 없이 내용을 감싼다`, async ({ page }, testInfo) => {
      await layoutFixture(page); await page.goto('/questions/71');
      await expect(page.getByText('질문 본문', { exact: true })).toBeVisible();
      const content = await page.locator('.article-content').boundingBox();
      expect(content.height, '한 줄 본문에 고정 높이로 빈 공간을 만들지 않는다').toBeLessThanOrEqual(100);
      await capture(page, testInfo);
    });

    test(`${width}px: 접힌 오류 제보는 간결하게 표시되고 지원 영역과 간격이 있다`, async ({ page }, testInfo) => {
      await layoutFixture(page); await page.goto('/detail/71');
      await expect(page.getByText('공고 정보가 잘못되었나요?', { exact: true })).toBeVisible();
      const report = page.locator('.job-detail > details');
      expect.soft((await report.boundingBox()).height, '접힌 제보 영역 높이').toBeLessThanOrEqual(90);
      await expectGap(page.locator('.apply-bar'), report, 20, 'y');
      await page.getByText('공고 정보가 잘못되었나요?', { exact: true }).click();
      await expect(page.getByLabel('공고 오류 내용')).toBeVisible();
      await expectContained(page); await capture(page, testInfo);
    });

    test(`${width}px: 관리자 목록과 등록 폼은 긴 텍스트와 날짜 입력에도 넘치지 않는다`, async ({ page }, testInfo) => {
      await layoutFixture(page); await page.goto('/admin/announcements');
      await expect(page.locator('.admin-row-title')).toBeVisible();
      await expectContained(page);
      await page.getByRole('link', { name: '공고 등록', exact: true }).click();
      await expect(page.getByLabel('모집 시작', { exact: true })).toBeVisible();
      await expectContained(page); await capture(page, testInfo);
    });

    test(`${width}px: 로그인과 회원가입의 입력 및 동작 버튼은 화면 안에 있다`, async ({ page }, testInfo) => {
      await layoutFixture(page, false); await page.goto('/login');
      await expect(page.getByLabel('아이디')).toBeVisible(); await expectContained(page);
      await page.getByRole('link', { name: '회원가입', exact: true }).click();
      await expect(page.getByRole('button', { name: '아이디 중복 검사' })).toBeVisible();
      await expectContained(page); await capture(page, testInfo);
    });
  });
}
