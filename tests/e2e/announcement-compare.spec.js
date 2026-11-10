import { test, expect } from './fixtures';

const base = { announcementType: 'EMP', language: ['JAVA'], startedDate: '2026-01-01T09:00:00', deadLineDate: '2037-10-26T17:00:00', deadlineMode: 'FIXED', minCareer: 0, maxCareer: 3, recruitmentClosed: false };
const postings = {
  71: { ...base, id: 71, title: '비교 백엔드 채용', company: 'DEMP', position: 'BACKEND', payment: 4000, salaryStatus: 'DISCLOSED' },
  72: { ...base, id: 72, title: '비교 프론트 채용', company: '데모', position: 'FRONTEND', salaryStatus: 'NEGOTIABLE' },
  73: { ...base, id: 73, title: '비교 교육 과정', company: '교육원', announcementType: 'EDU', position: null, payment: 0, deadlineMode: 'ALWAYS_OPEN', deadLineDate: null, education: { deliveryMode: 'ONLINE', region: 'SEOUL' } },
};

async function fixture(page) {
  const detailRequests = [];
  await page.addInitScript(() => localStorage.setItem('vuex', JSON.stringify({ Login: { token: 'compare-fixture', username: 'member' } })));
  await page.route('/api/**', route => {
    const url = new URL(route.request().url()), path = url.pathname;
    if (path === '/api/admin/me') return route.fulfill({ status: 403, json: {} });
    if (path === '/api/member/me') return route.fulfill({ json: { username: 'member', nickname: null } });
    if (path === '/api/member/me/bookmarks') return route.fulfill({ json: { content: Object.values(postings).map(announcement => ({ announcementId: announcement.id, savedAt: '2026-10-15T12:00:00', available: true, announcement })), hasNext: false, number: 0 } });
    const detail = /^\/api\/announce\/detail\/(\d+)$/.exec(path);
    if (detail) {
      detailRequests.push([Number(detail[1]), url.searchParams.get('recordView')]);
      const posting = postings[detail[1]];
      return posting ? route.fulfill({ json: { ...posting, company: { name: posting.company } } }) : route.fulfill({ status: 404, json: {} });
    }
    return route.fulfill({ json: [] });
  });
  return { detailRequests };
}

test('관심 공고에서 고른 공고를 비교하고 새로고침·열 빼기·돌아가기에서도 선택을 유지한다', async ({ page }) => {
  const { detailRequests } = await fixture(page);
  await page.goto('/mypage?tab=saved');
  const card = title => page.locator('.saved-card').filter({ hasText: title });
  await card('비교 백엔드 채용').getByLabel('비교에 담기').check();
  await expect(page.getByText('하나 더 고르면 비교할 수 있어요')).toBeVisible();
  await card('비교 교육 과정').getByLabel('비교에 담기').check();
  await expect(page).toHaveURL(url => url.searchParams.get('compare') === '71,73');
  await page.getByRole('link', { name: '비교하기' }).click();

  await expect(page).toHaveURL(url => url.pathname === '/compare' && url.searchParams.get('ids') === '71,73');
  const table = page.getByRole('region', { name: '공고 비교 표' });
  await expect(table.getByRole('columnheader')).toContainText(['항목', '비교 백엔드 채용', '비교 교육 과정']);
  await expect(table.getByRole('row', { name: /^종류/ }).getByRole('cell')).toHaveText(['채용', '부트캠프·교육']);
  await expect(table.getByRole('row', { name: /^교육비/ }).getByRole('cell')).toHaveText(['해당 없음', '무료 교육']);
  expect(detailRequests.every(([, recordView]) => recordView === 'false')).toBe(true);

  await page.reload();
  await expect(table.getByRole('row', { name: /^급여/ }).getByRole('cell')).toHaveText(['연봉 4,000만원', '해당 없음']);
  await page.getByRole('button', { name: '비교 교육 과정 비교에서 빼기' }).click();
  await expect(page).toHaveURL(url => url.searchParams.get('ids') === '71');
  await expect(page.getByRole('status')).toContainText('2개 이상');
  await page.getByRole('link', { name: '관심 공고에서 고르기' }).click();
  await expect(page).toHaveURL(url => url.pathname === '/mypage' && url.searchParams.get('tab') === 'saved' && url.searchParams.get('compare') === '71');
  await expect(card('비교 백엔드 채용').getByLabel('비교에 담기')).toBeChecked();
});

test('비공개로 바뀐 공고는 그 열에만 이유를 보여주고 나머지 비교는 유지한다', async ({ page }) => {
  await fixture(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/compare?ids=71,99,72');
  const headers = page.getByRole('region', { name: '공고 비교 표' }).getByRole('columnheader');
  await expect(headers.nth(1)).toContainText('비교 백엔드 채용');
  await expect(headers.nth(2)).toContainText('이용할 수 없는 공고');
  await expect(headers.nth(3)).toContainText('비교 프론트 채용');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
