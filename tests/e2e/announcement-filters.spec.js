import { test, expect } from './fixtures';

test('확장 항목과 정렬은 URL·서버 요청·새로고침·뒤로 가기에 복원된다', async ({ page }) => {
  const requests = await announcements(page);
  await page.goto('/?type=EMP&positions=SRE&languages=KOTLIN&orderBy=DEADLINE');
  await expect(page.getByLabel('공고 정렬')).toHaveValue('DEADLINE');
  await expect.poll(() => requests.at(-1)).toMatchObject({ positions: 'SRE', languages: 'KOTLIN', orderBy: 'DEADLINE', page: '0' });
  await page.getByLabel('공고 정렬').selectOption('VIEWS');
  await expect.poll(() => requests.at(-1)).toMatchObject({ positions: 'SRE', languages: 'KOTLIN', orderBy: 'VIEWS', page: '0' });
  await page.reload(); await expect(page.getByLabel('공고 정렬')).toHaveValue('VIEWS');
  await page.getByRole('button', { name: '기술 스택', exact: true }).click();
  await page.getByLabel('기술 스택 검색').fill('Spring Boot');
  await page.getByRole('checkbox', { name: 'Spring Boot', exact: true }).check();
  await expect.poll(() => requests.at(-1).languages?.split(',')).toEqual(expect.arrayContaining(['KOTLIN', 'SPRING_BOOT']));
  await expect(page).toHaveURL(/orderBy=VIEWS/);
  await page.goBack(); await expect(page).not.toHaveURL(/SPRING_BOOT/);
  await page.goBack(); await expect(page.getByLabel('공고 정렬')).toHaveValue('DEADLINE');
  await expect.poll(() => requests.at(-1)).toMatchObject({ orderBy: 'DEADLINE', page: '0' });
});

async function announcements(page) {
  const requests = [];
  await page.route('/api/announce*', route => {
    requests.push(Object.fromEntries(new URL(route.request().url()).searchParams));
    return route.fulfill({ json: { content: [{ id: 1, title: '필터 검증 공고', company: 'DEMP', announcementType: 'EMP', position: 'BACKEND', language: ['JAVA'], minCareer: 3, maxCareer: 5 }], number: 0, last: true } });
  });
  return requests;
}

test('검색 초안은 다른 필터 선택에 섞이지 않고 제출·개별 해제·뒤로 가기로 URL과 API에 복원된다', async ({ page }) => {
  const requests = await announcements(page);
  await page.goto('/?type=EMP&q=기존검색');
  await expect(page.getByRole('link', { name: '필터 검증 공고', exact: true })).toBeVisible();
  await page.getByLabel('공고 검색어').fill('입력중검색');
  await page.getByRole('button', { name: '기술 스택', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Java', exact: true }).check();
  await expect.poll(() => requests.at(-1)).toMatchObject({ languages: 'JAVA', title: '기존검색', page: '0' });
  await expect(page.getByRole('button', { name: '기존검색 조건 해제', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '입력중검색 조건 해제', exact: true })).toHaveCount(0);
  await expect(page.getByLabel('공고 검색어')).toHaveValue('입력중검색');
  await page.getByRole('button', { name: '검색', exact: true }).click();
  await expect.poll(() => requests.at(-1)).toMatchObject({ languages: 'JAVA', title: '입력중검색', page: '0' });
  await page.getByRole('button', { name: 'Java 조건 해제', exact: true }).click();
  await expect.poll(() => requests.at(-1).languages).toBeUndefined();
  await page.goBack();
  await expect.poll(() => requests.at(-1)).toMatchObject({ languages: 'JAVA', title: '입력중검색', page: '0' });
  await page.reload();
  await page.getByRole('button', { name: '기술 스택', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Java', exact: true })).toBeChecked();
  await expect(page.getByLabel('공고 검색어')).toHaveValue('입력중검색');
});

test('직무·기술 검색은 숨긴 선택을 유지하며 키보드 열기·Esc·모집 상태 선택은 단일 패널을 지킨다', async ({ page }) => {
  await announcements(page);
  await page.goto('/?type=EMP&positions=BACKEND&languages=JAVA');
  const positions = page.getByRole('button', { name: '직무·분야', exact: true });
  await positions.focus(); await page.keyboard.press('Enter');
  await page.getByLabel('직무 검색').fill('FRONTEND');
  await expect(page.getByRole('checkbox')).toHaveCount(1);
  await page.getByRole('checkbox', { name: '프론트엔드', exact: true }).check();
  await expect(page.getByRole('button', { name: '백엔드 조건 해제', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(positions).toBeFocused();
  await expect(positions).toHaveAttribute('aria-expanded', 'false');
  const languages = page.getByRole('button', { name: '기술 스택', exact: true });
  await languages.focus(); await page.keyboard.press('Space');
  await page.getByLabel('기술 스택 검색').fill('html');
  await expect(page.getByRole('checkbox')).toHaveCount(1);
  await page.getByRole('checkbox', { name: 'HTML', exact: true }).check();
  await page.getByLabel('기술 스택 검색').fill('');
  await expect(page.getByRole('checkbox', { name: 'Java', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'HTML', exact: true })).toBeChecked();
  await page.getByRole('button', { name: '모집 상태', exact: true }).click();
  await expect(page.locator('.filter-popover')).toHaveCount(1);
  await expect(languages).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('radio', { name: '모집 중', exact: true }).click();
  await expect(page.locator('.filter-popover')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '모집 상태', exact: true })).toBeFocused();
  await expect(page).toHaveURL(/status=OPEN/);
  await expect(page.getByRole('button', { name: '모집 중 조건 해제', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '모집 상태', exact: true }).click();
  await expect(page.getByRole('radio', { name: '모집 중', exact: true })).toBeChecked();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: '모집 상태', exact: true })).toBeFocused();
});

test('경력은 20년 URL·정확한 연차·오류·빠른 선택·해제를 기존 서버 의미로 전달한다', async ({ page }) => {
  const requests = await announcements(page);
  await page.goto('/?type=EMP&career=20');
  await expect.poll(() => requests.at(-1)?.career).toBe('20');
  const control = page.getByRole('button', { name: '내 경력', exact: true });
  await control.click();
  const years = page.getByRole('textbox', { name: '경력 연차', exact: true });
  await expect(years).toHaveValue('20');
  await years.fill('1.5'); await years.press('Enter');
  await expect(page.getByRole('alert')).toContainText('정수');
  await expect(years).toHaveValue('1.5');
  await expect(page).toHaveURL(/career=20/);
  expect(requests.at(-1).career).toBe('20');
  await years.fill('7'); await years.press('Enter');
  await expect.poll(() => requests.at(-1)).toMatchObject({ career: '7', page: '0' });
  await expect(control).toBeFocused();
  await control.click(); await page.getByRole('button', { name: '경력 3년 적용', exact: true }).click();
  await expect.poll(() => requests.at(-1).career).toBe('3');
  await control.click(); await page.getByRole('button', { name: '경력 조건 해제', exact: true }).click();
  await expect.poll(() => requests.at(-1).career).toBe('0');
  await expect(page).not.toHaveURL(/career=/);
  await expect(page.locator('#career-filter-value')).toHaveText('조건 없음');
});
