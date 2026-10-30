import { test, expect } from './fixtures';

for (const width of [320, 390, 1440]) {
  test(`탐색 랜딩 ${width}px: 실제 목록 연결과 팔레트·로컬 폰트 유지`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const calls = [];
    await page.route('/api/announce**', route => {
      calls.push(new URL(route.request().url()).searchParams.get('title'));
      return route.fulfill({ json: { content: [{ id: 71, title: '실제 API 경계의 공고', company: '검증 기업', language: ['JAVA'], position: 'BACKEND', announcementType: 'EMP' }], last: true } });
    });
    await page.goto('/?q=Java');
    await expect(page.locator('h1')).toHaveText('다음 커리어의 시작,내 조건에 맞게.');
    await page.locator('.discovery-primary-action').click();
    await expect(page.locator('#announcement-discovery')).toBeFocused();
    await expect(page.getByLabel('공고 검색어')).toHaveValue('Java');
    await expect(page.locator('.notice-title')).toHaveText('실제 API 경계의 공고');
    expect(calls).toContain('Java');
    await expect(page.locator('.discovery-primary-action')).toHaveCSS('background-color', 'rgb(35, 76, 106)');
    await expect(page.locator('.discovery-catalog')).toHaveCSS('background-color', 'rgb(227, 227, 227)');
    await page.evaluate(() => document.fonts.ready);
    const typography = await page.evaluate(() => ({ family: getComputedStyle(document.body).fontFamily, loaded: [...document.fonts].some(font => font.family.includes('Pretendard') && font.status === 'loaded'), width: document.documentElement.scrollWidth }));
    expect(typography.family).toContain('Pretendard Variable');
    expect(typography.loaded).toBe(true);
    expect(typography.width).toBeLessThanOrEqual(width);
    const license = await page.request.get('/fonts/LICENSE');
    expect(license.ok()).toBe(true);
    expect(await license.text()).toContain('SIL OPEN FONT LICENSE');
    const summary = page.locator('.discovery-faq summary').first();
    await summary.focus();
    await summary.press('Enter');
    await expect(page.locator('.discovery-faq details').first()).toHaveAttribute('open', '');
    await summary.press('Enter');
    await expect(page.locator('.discovery-faq details').first()).not.toHaveAttribute('open');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('.tagline-word').first()).toHaveCSS('opacity', '1');
    await expect(page.locator('.journey-learning')).toHaveCSS('transform', 'none');
    await page.locator('.notice-title').click();
    await expect(page).toHaveURL(/\/login\?redirect=/);
    const redirect = new URL(page.url()).searchParams.get('redirect');
    expect(redirect).toBe('/detail/71?q=Java');
  });
}
