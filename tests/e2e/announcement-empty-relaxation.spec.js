import { test, expect } from './fixtures';

const item = { id: 81, title: 'Kotlin 백엔드 채용', company: 'DEMP', announcementType: 'EMP', position: 'BACKEND', language: ['KOTLIN'],
  startedDate: '2026-01-01T09:00:00', deadLineDate: '2037-10-26T17:00:00', deadlineMode: 'FIXED', minCareer: 0, maxCareer: 3, recruitmentClosed: false };

test('결과가 없을 때 하나만 빼면 공고가 나오는 조건을 제안하고 누르면 나머지 선택을 유지한 채 결과를 보여준다', async ({ page }) => {
  const listQueries = [];
  await page.route('/api/**', route => {
    const url = new URL(route.request().url()), path = url.pathname;
    if (path === '/api/admin/me') return route.fulfill({ status: 403, json: {} });
    if (path === '/api/announce') {
      const title = url.searchParams.get('title'), size = url.searchParams.get('size');
      if (size === '8') listQueries.push(Object.fromEntries(url.searchParams));
      return route.fulfill({ json: { content: title ? [] : [item], last: true, number: 0 } });
    }
    return route.fulfill({ json: [] });
  });
  await page.goto('/?q=없는검색어&languages=KOTLIN');
  const empty = page.locator('.empty-state');
  await expect(empty.getByRole('heading')).toHaveText('“없는검색어”에 해당하는 공고가 없습니다.');
  await expect(empty.locator('[data-test="empty-relax"]')).toHaveText(['검색어 “없는검색어” 빼고 보기']);
  await empty.getByRole('button', { name: '검색어 “없는검색어” 빼고 보기' }).click();
  await expect(page).toHaveURL(url => url.pathname === '/' && !url.searchParams.has('q') && url.searchParams.get('languages') === 'KOTLIN');
  await expect(page.getByRole('link', { name: 'Kotlin 백엔드 채용' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Kotlin 조건 해제' })).toBeVisible();
  expect(listQueries.at(-1)).toMatchObject({ title: '', languages: 'KOTLIN', page: '0' });
});
