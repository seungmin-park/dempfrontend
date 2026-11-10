import { readFile } from 'node:fs/promises';
import { test, expect } from './fixtures';

const posting = {
  id: 71, title: '지원 준비 확인 공고', company: { name: 'DEMP' }, announcementType: 'EMP', position: 'BACKEND', language: ['KOTLIN', 'SPRING'],
  deadlineMode: 'FIXED', startedDate: '2026-01-01T09:00:00', deadLineDate: '2037-10-26T17:00:00', sourceVerifiedAt: '2026-11-08T14:20:00',
  content: Array.from({ length: 80 }, (_, index) => `<p>상세 본문 ${index + 1}번째 문단입니다.</p>`).join(''), accessUrl: 'https://example.test/posting', recruitmentClosed: false,
};

async function fixture(page) {
  await page.addInitScript(() => localStorage.setItem('vuex', JSON.stringify({ Login: { token: 'detail-fixture', username: 'member' } })));
  await page.route('/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/admin/me') return route.fulfill({ status: 403, json: {} });
    if (path === '/api/announce/detail/71') return route.fulfill({ json: posting });
    if (path === '/api/question/hashtags') return route.fulfill({ json: ['kotlin', 'React'] });
    if (path === '/api/member/me/bookmarks/status') return route.fulfill({ json: { savedIds: [] } });
    return route.fulfill({ json: [] });
  });
}

for (const width of [390, 1440]) {
  test(`${width}px: 긴 공고를 읽는 중에도 지원 버튼이 화면에 남는다`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await fixture(page);
    await page.goto('/detail/71');
    await page.getByText('상세 본문 40번째 문단입니다.').scrollIntoViewIfNeeded();
    await expect(page.getByRole('link', { name: '지원하기', exact: true })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('링크 복사·마감 일정 내려받기·관련 면접 질문 이동을 상세에서 바로 할 수 있다', async ({ page, context, baseURL }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseURL });
  await fixture(page);
  await page.goto('/detail/71?languages=KOTLIN');
  await page.getByRole('button', { name: '링크 복사' }).click();
  await expect(page.getByRole('status').filter({ hasText: '링크를 복사했습니다.' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`${baseURL}/detail/71`);

  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: '마감일 캘린더에 추가' }).click()]);
  expect(download.suggestedFilename()).toBe('demp-deadline-71.ics');
  const calendar = await readFile(await download.path(), 'utf8');
  expect(calendar).toContain('DTEND:20371026T080000Z');
  expect(calendar.replace(/\r\n /g, '')).toContain('SUMMARY:[마감] DEMP · 지원 준비 확인 공고');

  const related = page.getByRole('region', { name: '관련 면접 질문' });
  await expect(related.getByRole('link')).toHaveText(['kotlin']);
  await related.getByRole('link', { name: 'kotlin' }).click();
  await expect(page).toHaveURL(url => url.pathname === '/question' && url.searchParams.get('hashtags') === 'kotlin');
});
