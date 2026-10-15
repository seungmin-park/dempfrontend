import { test, expect } from './fixtures';

async function accountFixture(page) {
  const state = { nickname: null, failNickname: true, changes: 0 };
  await page.addInitScript(() => { if (!localStorage.getItem('vuex')) localStorage.setItem('vuex', JSON.stringify({ Login: { username: 'member', token: 'account-token' } })); });
  await page.route('/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/member/me/bookmarks/status') return route.fulfill({ json: { savedIds: [] } });
    const method = route.request().method();
    const reply = (status, data) => route.fulfill({ status, contentType: 'application/json', body: status === 204 ? '' : JSON.stringify(data) });
    if (path === '/api/admin/me') return reply(403, {});
    if (path === '/api/member/me/password') { state.changes++; return reply(204); }
    if (path === '/api/member/me') {
      if (method === 'PATCH') {
        if (state.failNickname) { state.failNickname = false; return reply(500, {}); }
        state.nickname = route.request().postDataJSON().nickname;
      }
      return reply(200, { id: 1, username: 'member', nickname: state.nickname, admin: false });
    }
    return reply(200, { content: [], number: 0, last: true });
  });
  return state;
}

test('마이페이지는 닉네임 실패 입력을 보존하고 저장 재조회 및 비밀번호 변경 후 재로그인을 안내한다', async ({ page }) => {
  const state = await accountFixture(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/'); await page.getByRole('link', { name: '마이페이지', exact: true }).click();
  await expect(page.getByRole('heading', { name: '마이페이지' })).toBeVisible();
  await page.getByLabel('닉네임', { exact: true }).fill('새로운 회원');
  await page.getByRole('button', { name: '닉네임 저장' }).click();
  await expect(page.getByRole('alert')).toContainText('다시 시도');
  await expect(page.getByLabel('닉네임', { exact: true })).toHaveValue('새로운 회원');
  await page.getByRole('button', { name: '닉네임 저장' }).click();
  await expect(page.getByRole('status')).toContainText('닉네임을 저장했습니다');
  await page.reload(); await expect(page.getByLabel('닉네임', { exact: true })).toHaveValue('새로운 회원');
  await page.getByLabel('현재 비밀번호', { exact: true }).fill('password');
  await page.getByLabel('새 비밀번호', { exact: true }).fill('new-password');
  await page.getByLabel('새 비밀번호 확인', { exact: true }).fill('new-password');
  await page.getByRole('button', { name: '비밀번호 변경', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('다시 로그인');
  expect(state.changes).toBe(1);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('vuex')).Login.token)).toBe('');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', { name: '다시 로그인', exact: true }).click();
  await expect(page).toHaveURL(url => url.pathname === '/login' && url.searchParams.get('redirect') === '/mypage');
});

test('비로그인 마이페이지 진입은 로그인 후 돌아올 경로를 보존한다', async ({ page }) => {
  await page.goto('/mypage');
  await expect(page).toHaveURL(url => url.pathname === '/login' && url.searchParams.get('redirect') === '/mypage');
});
