import { test, expect } from './fixtures';

test('수시 채용의 마감 방식은 가상 날짜 없이 표시하고 지원 경로를 유지한다',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('vuex',JSON.stringify({Login:{token:'deadline-fixture',username:'member'}})));
  let mode='UNTIL_FILLED';
  await page.route('/api/**',route=>{
    const path=new URL(route.request().url()).pathname;
    if(path==='/api/admin/me') return route.fulfill({status:403,json:{}});
    if(path==='/api/announce/detail/71') return route.fulfill({json:{title:'수시 채용',company:{name:'DEMP'},announcementType:'EMP',language:[],startedDate:'2026-01-01T09:00:00',deadLineDate:null,deadlineMode:mode,content:'<p>본문</p>',accessUrl:'https://example.test/posting'}});
    return route.fulfill({json:[]});
  });
  for(const [value,label] of [['UNTIL_FILLED','채용 시 마감'],['ALWAYS_OPEN','상시 모집']]){
    mode=value;await page.goto('/detail/71');
    await expect(page.getByLabel('현재 모집 상태')).toHaveText('모집 중');
    await expect(page.getByText(`지원기간 : 2026.01.01 09:00 ~ ${label}`)).toBeVisible();
    await expect(page.getByRole('link',{name:'지원하기',exact:true})).toBeVisible();
  }
});
