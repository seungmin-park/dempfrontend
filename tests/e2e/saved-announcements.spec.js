import { test, expect } from './fixtures';

async function fixture(page, authenticated = false) {
  const state = { saved: new Set(), failRemove: false, failStatus: false, expireSave: false };
  const item = { id:71,title:'관심 백엔드 채용',company:'DEMP',announcementType:'EMP',position:'BACKEND',language:['JAVA'],
    startedDate:'2026-01-01T09:00:00',deadLineDate:'2037-10-26T17:00:00',deadlineMode:'FIXED',minCareer:0,maxCareer:3,
    content:'<p>관심 공고 본문</p>',accessUrl:'https://example.test/posting',recruitmentClosed:false };
  if (authenticated) await page.addInitScript(()=>localStorage.setItem('vuex',JSON.stringify({Login:{token:'saved-fixture',username:'member'}})));
  await page.route('/api/**', async route => {
    const url=new URL(route.request().url()),path=url.pathname;
    const reply=(status,data)=>route.fulfill({status,json:data});
    if (path==='/api/admin/me') return reply(403,{});
    if (path==='/api/member/validUsername') return reply(200,true);
    if (path==='/api/member/save') return reply(200,{id:1,username:'member'});
    if (path==='/api/member/login') return reply(200,{jwt:'saved-fixture',username:'member'});
    if (path==='/api/announce') return reply(200,{content:[item],last:true,number:0});
    if (path==='/api/announce/scroll') return reply(200,[]);
    if (path==='/api/announce/detail/71') return reply(200,{...item,company:{name:'DEMP'}});
    if (path==='/api/member/me/bookmarks/status') {
      if (state.failStatus) { state.failStatus=false;return reply(503,{}); }
      return reply(200,{savedIds:[...state.saved].filter(id=>(url.searchParams.get('announcementIds')||'').split(',').includes(String(id)))});
    }
    if (path==='/api/member/me/bookmarks') return reply(200,{content:[...state.saved].map(id=>({announcementId:id,savedAt:'2026-10-15T12:00:00',available:true,announcement:item})),hasNext:false,number:0});
    if (path==='/api/member/me/bookmarks/71') {
      const saved=route.request().postDataJSON().saved;
      if (state.expireSave) { state.expireSave=false;return reply(401,{}); }
      if (!saved && state.failRemove) {state.failRemove=false;return reply(503,{});}
      if(saved) state.saved.add(71);else state.saved.delete(71);
      return reply(200,{announcementId:71,saved});
    }
    return reply(404,{});
  });
  return state;
}

test('비로그인 저장은 가입과 로그인을 거쳐 검색 조건으로 복귀하고 저장·재조회·실패 복구·해제로 이어진다',async({page})=>{
  const state=await fixture(page);
  await page.setViewportSize({width:390,height:844});
  await page.goto('/?q=백엔드');await page.getByRole('button',{name:'관심 공고 저장',exact:true}).click();
  await expect(page).toHaveURL(url=>url.pathname==='/login' && new URL(url.searchParams.get('redirect'),url.origin).searchParams.get('q')==='백엔드' && new URL(url.searchParams.get('redirect'),url.origin).searchParams.get('saveAnnouncement')==='71');
  await page.getByRole('link',{name:'회원가입',exact:true}).click();
  await expect(page.getByRole('heading',{name:'함께 시작해요',exact:true})).toBeVisible();
  await page.getByLabel('아이디',{exact:true}).fill('member');await page.getByRole('button',{name:'중복 검사'}).click();
  await expect(page.getByText('사용 가능한 아이디 입니다.',{exact:true})).toBeVisible();
  await page.getByLabel('비밀번호',{exact:true}).fill('password123');await page.getByLabel('비밀번호 재확인',{exact:true}).fill('password123');
  await page.getByRole('button',{name:'회원가입',exact:true}).click();await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading',{name:'다시 만나 반가워요',exact:true})).toBeVisible();
  await page.getByLabel('아이디',{exact:true}).fill('member');await page.getByLabel('비밀번호',{exact:true}).fill('password123');
  await page.getByRole('button',{name:'로그인',exact:true}).last().click();
  await expect(page).toHaveURL(url=>url.pathname==='/'&&url.searchParams.get('q')==='백엔드'&&!url.searchParams.has('saveAnnouncement'));
  await expect(page.getByRole('button',{name:'관심 공고 해제',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('link',{name:'관심 공고',exact:true}).click();await expect(page.getByRole('heading',{name:'관심 공고',exact:true})).toBeVisible();
  await page.reload();await expect(page.getByRole('link',{name:'관심 백엔드 채용'})).toBeVisible();
  state.failRemove=true;await page.getByRole('button',{name:'관심 공고 해제',exact:true}).click();await expect(page.getByRole('alert')).toContainText('다시');
  await expect(page.getByRole('link',{name:'관심 백엔드 채용'})).toBeVisible();
  await page.getByRole('button',{name:'관심 공고 해제',exact:true}).click();await expect(page.getByText('저장한 공고가 없습니다')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('목록과 상세의 저장 상태는 재조회로 일치하고 상태 조회 실패를 복구한다',async({page})=>{
  const state=await fixture(page,true);state.failStatus=true;
  await page.goto('/');await expect(page.getByRole('alert')).toContainText('상태를 확인하지 못했습니다');
  await page.getByRole('button',{name:'저장 상태 다시 확인'}).click();
  await page.getByRole('button',{name:'관심 공고 저장',exact:true}).click();
  await expect(page.getByRole('button',{name:'관심 공고 해제',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('link',{name:'관심 백엔드 채용',exact:true}).click();
  await expect(page.getByRole('button',{name:'관심 공고 해제',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByText('지원기간 : 2026.01.01 09:00 ~ 2037.10.26 17:00')).toBeVisible();
  await page.getByRole('button',{name:'관심 공고 해제',exact:true}).click();await page.reload();
  await expect(page.getByRole('button',{name:'관심 공고 저장',exact:true})).toHaveAttribute('aria-pressed','false');
});

test('수시 채용의 채용 시 마감과 상시 모집은 가상 날짜 없이 목록·상세에 표시된다',async({page})=>{
  await fixture(page,true);
  for(const [mode,label] of [['UNTIL_FILLED','채용 시 마감'],['ALWAYS_OPEN','상시 모집']]) {
    await page.route('**/api/announce/detail/71*',route=>route.fulfill({json:{title:'수시 채용',company:{name:'DEMP'},announcementType:'EMP',language:[],startedDate:'2026-01-01T09:00:00',deadLineDate:null,deadlineMode:mode,content:'<p>본문</p>',accessUrl:'https://example.test/posting'}}));
    await page.goto('/detail/71');await expect(page.getByLabel('현재 모집 상태')).toHaveText('모집 중');
    await expect(page.getByText(`지원기간 : 2026.01.01 09:00 ~ ${label}`)).toBeVisible();
    await expect(page.getByRole('link',{name:'지원하기',exact:true})).toBeVisible();
    await page.unroute('**/api/announce/detail/71*');
  }
});


test('저장 도중 세션이 만료돼도 재로그인 후 선택한 공고 저장을 이어간다',async({page})=>{
  const state=await fixture(page,true);state.expireSave=true;
  await page.goto('/?q=백엔드');await page.getByRole('button',{name:'관심 공고 저장',exact:true}).click();
  await expect(page).toHaveURL(url=>url.pathname==='/login' && new URL(url.searchParams.get('redirect'),url.origin).searchParams.get('q')==='백엔드' && new URL(url.searchParams.get('redirect'),url.origin).searchParams.get('saveAnnouncement')==='71');
  await page.getByLabel('아이디',{exact:true}).fill('member');await page.getByLabel('비밀번호',{exact:true}).fill('password123');
  await page.getByRole('button',{name:'로그인',exact:true}).last().click();
  await expect(page.getByRole('button',{name:'관심 공고 해제',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page).toHaveURL(url=>url.pathname==='/'&&url.searchParams.get('q')==='백엔드'&&!url.searchParams.has('saveAnnouncement'));
});

test("만료된 로그인 정보로 처음 접속해도 공개 공고 화면에 머문다", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("vuex", JSON.stringify({ Login: { token: "expired-token", username: "member" } })));
  await page.route("/api/**", route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/announce") return route.fulfill({ json: { content: [], last: true, number: 0 } });
    return route.fulfill({ status: 401, json: { message: "expired" } });
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /공고 목록/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "로그인", exact: true })).toBeVisible();
  await expect(page).toHaveURL("/");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("vuex")).Login)).toEqual({ token: "", username: "" });
});
