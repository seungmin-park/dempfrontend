import { test, expect } from './fixtures';

const items = Array.from({ length: 24 }, (_, index) => ({
  id: 101 + index, title: `복귀 확인 공고 ${String(index + 1).padStart(2, '0')}`, company: '데모 컴퍼니', announcementType: 'EMP', position: 'BACKEND',
  language: ['JAVA'], startedDate: '2026-01-01T09:00:00', deadLineDate: '2037-10-26T17:00:00', deadlineMode: 'FIXED', minCareer: 0, maxCareer: 3,
  content: '<p>본문</p>', accessUrl: 'https://example.test/posting', recruitmentClosed: false,
}));

async function fixture(page) {
  const listPages = [];
  await page.addInitScript(() => localStorage.setItem('vuex', JSON.stringify({ Login: { token: 'return-fixture', username: 'member' } })));
  await page.route('/api/**', async route => {
    const url = new URL(route.request().url()), path = url.pathname;
    const reply = (status, data) => route.fulfill({ status, json: data });
    if (path === '/api/admin/me') return reply(403, {});
    if (path === '/api/announce') {
      const pageNumber = Number(url.searchParams.get('page')), size = Number(url.searchParams.get('size'));
      if (size === 8) listPages.push(pageNumber);
      const content = items.slice(pageNumber * size, pageNumber * size + size);
      return reply(200, { content, last: (pageNumber + 1) * size >= items.length, number: pageNumber });
    }
    if (path === '/api/announce/scroll') return reply(200, []);
    if (path.startsWith('/api/announce/detail/')) {
      const item = items.find(candidate => String(candidate.id) === path.split('/').at(-1));
      return reply(200, { ...item, company: { name: item.company } });
    }
    if (path === '/api/member/me/bookmarks/status') return reply(200, { savedIds: [] });
    if (path === '/api/question/hashtags') return reply(200, []);
    return reply(404, {});
  });
  return { listPages };
}

async function openThirteenth(page) {
  await page.goto('/?languages=JAVA');
  const cards = page.locator('.job-card');
  await expect(cards).toHaveCount(8);
  await expect(cards.first().locator('.job-company')).toHaveText('데모 컴퍼니');
  await expect.poll(async () => {
    await page.evaluate(() => document.querySelector('[data-test="list-end"]')?.scrollIntoView({ block: 'end' }));
    return cards.count();
  }).toBe(24);
  await expect(page.getByText('현재 조건의 공고를 모두 확인했습니다.')).toBeVisible();
  const target = page.locator('.job-grid').getByRole('link', { name: '복귀 확인 공고 13', exact: true });
  await target.scrollIntoViewIfNeeded();
  await target.click();
  await expect(page).toHaveURL(url => url.pathname === '/detail/113' && url.searchParams.get('languages') === 'JAVA');
  await expect(page.getByRole('heading', { name: '복귀 확인 공고 13', level: 1 })).toBeVisible();
}

async function expectReturnedToThirteenth(page, listPages) {
  await expect(page).toHaveURL(url => url.pathname === '/' && url.searchParams.get('languages') === 'JAVA');
  await expect(page.locator('.job-card')).toHaveCount(24);
  const target = page.locator('.job-grid').getByRole('link', { name: '복귀 확인 공고 13', exact: true });
  await expect(target).toBeInViewport();
  await expect(target).toBeFocused();
  expect(listPages).toEqual([0, 1, 2]);
}

test('상세에서 브라우저 뒤로 가기로 돌아오면 불러온 페이지와 누른 공고 위치가 유지된다', async ({ page }) => {
  const { listPages } = await fixture(page);
  await openThirteenth(page);
  listPages.length = 0;
  await page.goBack();
  await expectReturnedToThirteenth(page, listPages);
  await expect(page.getByRole('region', { name: '최근 본 공고' }).getByRole('link')).toHaveText(['복귀 확인 공고 13 · 데모 컴퍼니']);
});

test('상세의 검색 결과로 돌아가기 버튼도 기록을 늘리지 않고 같은 위치로 돌아오며 새로 들어온 목록은 처음부터 보여준다', async ({ page }) => {
  const { listPages } = await fixture(page);
  await openThirteenth(page);
  const historyLength = await page.evaluate(() => history.length);
  listPages.length = 0;
  await page.getByRole('button', { name: '검색 결과로 돌아가기' }).click();
  await expectReturnedToThirteenth(page, listPages);
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
  listPages.length = 0;
  await page.goto('/?languages=JAVA');
  await expect(page.locator('.job-card')).toHaveCount(8);
  expect(listPages).toEqual([0]);
  expect(await page.evaluate(() => scrollY)).toBe(0);
});
