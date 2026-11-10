# 공고 탐색의 맥락 유지와 비교

2026-11-11. 브랜치 `refactor/announcement-discovery-continuity-and-comparison`, worktree `/Users/seungmin/Desktop/repo/dempfrontend/.worktrees/announcement-discovery-continuity-and-comparison`. 공통 규칙은 [AGENTS.md](../../AGENTS.md)를 따른다. 사용자 요청 전까지 commit하지 않는다.

## 배경

배포 후 실제로 공고를 찾으며 불편이 드러났다. 상세에서 돌아오면 목록이 처음부터 다시 시작했다. 결과가 없으면 조건이 한꺼번에 지워졌다. 마감은 날짜만 보여서 남은 시간을 계산해야 했다. 저장한 공고를 비교할 방법도 없었다. 여러 채용 탐색 서비스가 같은 문제를 어떻게 푸는지 방문자 시점에서 시장 조사했고, [2026-10-08 조사](../announcement-market-research.md)의 정렬 비교를 함께 참고했다. 화면 분석 원본은 사용자 로컬 `~/Desktop/ui/README.md`에 있다.

조사한 서비스의 화면·문구를 옮기지 않는다. DEMP가 이미 가진 데이터(정확한 마감 시각, 회원별 관심 공고, 질문 태그)와 원칙(선택 보존, 가상 값 금지)에 맞게 다시 설계한다. 상세 열람의 로그인 요구는 `spec.md`의 제품 결정이므로 유지한다.

## 범위와 보장할 결과

| 묶음 | 사용자가 얻는 결과 | 실패해도 지킬 상태 |
| --- | --- | --- |
| 목록 복귀 | 상세에서 뒤로 오면 그동안 불러온 페이지와 누른 공고 위치로 돌아온다 | 복원 조회 실패 시 기존 오류·재시도 경로, 다른 검색 조건이나 새 진입에는 복원하지 않음 |
| 결과 없음 | 결과를 되살리는 조건만 '빼고 보기'로 제안하고 나머지 선택은 유지한다 | 확인 조회 실패·지연 응답은 제안을 숨기고 기존 전체 해제 경로 유지 |
| 남은 시간 | 정확한 마감 시각이 있는 공고에 '오늘 18:00 마감', '내일 마감', 'N일 남음'을 함께 표시 | 채용 시 마감·상시·미확인·마감 공고는 가상 기한을 만들지 않음 |
| 개수 문구 | 더 불러올 수 있으면 '지금까지 N개', 끝까지 불러왔으면 '전체 N개' | 서버 전체 건수를 추정하지 않음 |
| 상세 | 핵심 조건 정의 목록, 따라오는 지원 바, 링크 복사, 마감 캘린더 파일, 기술 태그별 면접 질문 링크 | 복사 실패 안내, 정확한 마감 시각이 없으면 캘린더 숨김, 질문 태그 조회 실패 시 링크 영역 숨김 |
| 비교 | 관심 공고에서 2~4개를 골라 URL로 공유·새로고침 가능한 비교 표 | 일부 공고 조회 실패·비공개도 나머지 비교 유지, 해당 열에 이유와 빼기 동작 |
| 최근 본 공고 | 로그인 계정별로 이 기기에 최근 상세 20개를 기록하고 목록에서 다시 연다 | 상세 조회 실패는 기록하지 않음, 저장소 접근 실패는 기능만 숨김, 다른 계정에 노출하지 않음 |

## 책임

```text
AnnouncementList ── 페이지 누적·상세 이동 ──► router/listReturn (세션 저장: 경로별 불러온 페이지·누른 ID)
       │                                     ▲ 뒤로 이동(history.state.forward)일 때만 소비
       ├── 결과 없음 ──► useRelaxedSearchSuggestions ──► api/announcements.hasMatchingAnnouncements
       │                  (요청 세대·실패 숨김)          (size 1 조회)
       └── 카드 ──► presentation/recruitment.deadlineCountdown (순수 함수, 시각 입력)
AnnouncementDetail ── 조회 성공 ──► recentAnnouncements (계정별 localStorage)
       ├── 지원 바: clipboard / presentation/deadlineCalendar (ics 문자열)
       └── 관련 질문: getQuestionHashtags ∩ 공고 기술 → /question?hashtags=
SavedAnnouncements ── 선택 (route query compare) ──► /compare?ids= ──► AnnouncementCompare
                                                                  └─ getAnnouncementDetail(recordView=false)
```

## 진행 기록

Red/Green/Refactor와 검증 결과는 아래에 단계별로 추가한다.

### 1. 남은 시간·개수·결과 없음·목록 복귀

- 남은 시간: `deadlineSummary(period, now)`를 처음에는 지금 동작(날짜만)을 반환하는 형태로 두고 `DeadlineSummary.spec.js`를 실행했다. Red는 6건이 assertion에서 실패했다(예: `'2026.11.11 18:00 마감'` ≠ `'오늘 18:00 마감'`). 미확정 마감과 마감·시작 전 2건은 기존 동작으로 이미 통과했다. 한국 날짜 기준 일수 계산을 넣어 Green이 됐다. 카드 연결 테스트도 날짜만 보이는 Red를 확인한 뒤 Green이 됐다.
- 개수: Red는 `'공고 목록 2'` ≠ `'공고 목록 지금까지 2개'`였다. 마지막 페이지에서만 '전체 N개'를 쓴다.
- 결과 없음: 순수 후보 함수 3건과 컴포넌트 2건이 assertion Red였다. 확인 요청을 먼저 구현한 상태에서 '조건 변경 후 늦은 응답' 테스트가 assertion으로 실패하는 것을 확인했다(경쟁 Red). 그다음 요청 세대 비교를 넣었다. 기존 테스트 2건은 목록 요청과 확인 요청(size 1)을 구분해 세도록 바꾸고, 확인 요청 수도 함께 검증해 assertion을 강화했다.
- 목록 복귀: headed Playwright로 실제 재현했다. '검색 결과로 돌아가기'로 돌아오면 24건 중 8건만 남았고(Expected 24, Received 8), 브라우저 뒤로 가기에서는 포커스가 돌아오지 않았다. 단위 Red 2건(기록 저장, 페이지 복원) 뒤에 구현했다. 테스트 쪽 실수 3건은 기능 Red와 구분해 고쳤다. ① '더보기' 클릭이 자동 로딩과 경쟁했다. ② 페이지 맨 아래로 이동하면 목록 끝 표식이 화면을 지나쳤다. ③ 목록 fixture에 회사명을 객체로 넣어 JSON이 그대로 출력됐다. 실제 `AnnouncementResponse.company`는 문자열이다.
- 결과: Vitest 63파일·401건, typecheck, lint, `announcement-return.spec.js` production·development 반복 실행 모두 통과.

### 2. 상세 화면

- 순수 함수(`deadlineCalendar`, `matchingQuestionTags`)는 stub이 `null`을 반환해 TypeError가 났다. 그래서 문자열 타입 assertion을 앞에 두어 4건 모두 assertion Red로 만들었다. 테스트 쪽 실수 2건은 Green 단계에서 고쳤다. ① 기대값이 75바이트 줄 접기를 고려하지 않았다. ② 세미콜론 이스케이프 기대값에 오타가 있었다(RFC 5545는 TEXT 값에서 `\;`를 요구한다).
- 컴포넌트 Red는 5건이었다. 기존 '회사명 : …' 문장 형식 assertion 1건은 정의 목록 구조로 바꾸면서 같은 엄격도를 유지했다. 이후 회사명이 제목 영역과 정의 목록에 중복되어 E2E strict mode가 실패했고, 정의 목록에서 '회사' 행을 뺐다(제목 영역에 이미 표시됨).
- 따라오는 지원 바 E2E는 CSS를 먼저 쓴 뒤에 작성했다. 그래서 sticky 규칙만 잠시 지운 상태에서 390·1440px 모두 `toBeInViewport` 실패를 확인하고 되돌렸다. 테스트를 나중에 쓴 순서를 그대로 기록한다.
- 질문 태그 요청이 추가되면서 기존 테스트 2건이 영향을 받았다. 상세 요청 수만 세도록 바꿨고, `DetailStates`의 `$router` mock에는 실제 라우터에 있는 `resolve`를 보완했다.

### 3. 최근 본 공고

- assertion Red 4건(`null.map` TypeError는 존재 assertion을 먼저 두어 정리). 계정별 키 `demp:recent-announcements:<username>`, 최대 20개, 손상 기록 무시, 저장소 예외 무시. 상세 조회 성공에서만 기록. 목록 화면 view가 store를 읽게 되어 `DiscoveryLanding` 테스트에 실제 앱과 같은 store 상태를 제공했다.

### 4. 관심 공고 비교

- Red는 8건(순수 4, 비교 화면 2, 선택 UI 2)이었다. 선택 상태는 MyPage가 `?compare=`로 소유하고, `SavedAnnouncements`는 props/event로만 받는다. `/compare?ids=`는 route props로 ID를 넘긴다. 비교 조회는 `recordView=false`로 조회수를 올리지 않는다. 404는 '이용할 수 없는 공고', 그 밖의 실패는 열 단위 재시도로 구분한다.

### 전체 검증과 기존 실패

- `npm run verify -- --headed`가 처음에 `Unit totals do not match assertions`로 멈췄다. verifier는 suite 수와 파일 수가 같다고 가정하는데(이 저장소는 `describe`를 쓰지 않음), 새로 추가한 `describe` 6개가 suite로 세어졌기 때문이다. 이를 최상위 test로 펼쳤다. 펼치는 과정에서 한 파일의 test 10건이 수집되지 않는 실수가 있었는데, 이전 보고서와 이름을 비교해 429건이 모두 같은 이름으로 돌아온 것을 확인했다.
- 기존 간헐 실패: `responsive-layout.spec.js`의 640px 카드 간격 검사. 이 브랜치에서 48회 중 3회, `origin/main` 임시 worktree에서도 48회 중 2회 실패했다(-19·-20·-50px). 검색 후 목록이 다시 그려지는 도중에 측정하는 것이 원인이라고 보고, `.job-grid[aria-busy=false]`를 기다리게 했다. 이후 72회 연속 통과했다. 비교용 worktree는 제거했다.
- 최종: `npm run verify -- --headed` 성공 — contracts 0, types 0, unit 66파일·429건, lint 0, build 146파일, browser 270건(production·development, Vue 경고 없음). `scripts/required-verification.json`에 새 단위 파일 5개, 핵심 단위 assertion 8건, E2E 8건을 등록했다.
- 범위 밖: 실제 Spring/H2 화면 검증은 하지 않았다. fixture E2E는 백엔드 영속성을 증명하지 않는다. 사용한 API는 모두 기존 계약이다(목록 `size`, 상세 `recordView=false`, `/api/question/hashtags`, 상세 응답의 `sourceVerifiedAt`). 백엔드 DTO와 보안 설정은 코드로 대조했다.

### 이름·책임 검토

- 이름이 실제 효과와 맞는지 확인했다. `takeListReturn`은 읽고 지운다. `hasMatchingAnnouncements`는 1건 GET으로 존재 여부만 확인한다. `recordRecentAnnouncement`·`forgetRecentAnnouncements`는 저장소에 쓰고 지운다. `deadlineCalendar`는 문자열을 만들거나 `null`을 반환한다.
- 상태 소유자: 목록 복귀 기록은 `router/listReturn`, 확인 요청 세대는 `useRelaxedSearchSuggestions`, 비교 열 상태는 `useAnnouncementComparison`, 최근 본 공고는 `useRecentAnnouncements`가 소유한다. 표시 규칙은 presentation 순수 함수에 두었다. Vue 컴포넌트는 props/event와 렌더링만 맡는다.
- 공개로 바꾼 함수는 `koreaTime`과 `responseStatus` 두 개다. 기존 동작은 바꾸지 않았고, 비교와 캘린더에서 재사용하려고 export했다. `filtersToQuery`는 읽기 전용 입력도 받도록 넓혔을 뿐 호출부는 그대로다.
- Refactor: Green 이후 추가 구조 변경은 하지 않았다. 각 단계에서 이미 책임을 나눠 두었고, 단순 위임 객체를 만들 이유도 찾지 못했다.

### 실제 Spring/H2 사용자 흐름

- 대상: 백엔드 `demp` main `637d301`에서 새로 만든 bootJar. local 프로필, 격리 메모리 H2(`create-drop`), 포트 18081을 쓰고 관리자 seed는 공용 runtime verifier 방식을 따랐다. 프런트는 이 worktree의 production build를 `vite preview`(포트 5180)로 띄웠고 `DEV_API_TARGET`으로 백엔드에 연결했다. 두 프로세스의 명령줄과 포트를 확인한 뒤 사용했고, 검증 후 이 둘만 종료했다.
- 데이터: **실제 관리자 API**(`/api/admin/announcements`, multipart)로 채용 10건(마감 오늘·2일 후·그 이후, Kotlin·Spring)과 교육 1건을 공개로 등록했다. 질문 API로 `Kotlin` 태그 질문 1건도 만들었다. 공개 목록 API에서 12건이 조회됨을 확인했다.
- 실행: 이 세션은 cmux 밖에서 실행됐다(`CMUX_WORKSPACE_ID` 없음). 그래서 cmux 브라우저 대신 일회성 headed Chromium 스크립트로 실제 UI를 클릭했다. 저장소의 fixture Playwright suite와는 별개의 실행이다.
- 결과 9/9 통과:
  1. 로그인 후 목록 복귀
  2. '지금까지 8개'·'오늘 18:00 마감'(강조)·'2일 남음'
  3. 끝까지 불러오면 '전체 12개'. 2페이지 공고 상세의 정의 목록·관련 질문 `Kotlin`·링크 복사(클립보드 값 확인)·`.ics`의 `DTEND:20261127T090000Z`
  4. '검색 결과로 돌아가기'가 history 길이 그대로 12개와 누른 공고 포커스 복원. 최근 본 공고 표시
  5. 브라우저 뒤로 가기도 포커스 복원
  6. 운영자 확인일·공개 연봉. `Kotlin` 링크로 `/question?hashtags=Kotlin`의 실제 질문 표시
  7. 결과 없음에서 '검색어 “없는검색어” 빼고 보기' 하나만 제안되고, 누르면 기술 조건은 유지된 채 결과 표시
  8. 목록에서 관심 공고 2건 저장 → 서버 API 재조회로 `[1, 11]` 확인 → 비교·새로고침·열 빼기·돌아가기에서 선택 유지. 비교 전후에 `recordView=false`로 다시 조회한 조회수가 같음
  9. 예상하지 않은 Vue 경고 0
- 화면 근거: [목록 남은 시간](../screenshots/announcement-discovery/list-countdown.png), [복귀 포커스](../screenshots/announcement-discovery/returned-focus.png), [결과 없음 제안](../screenshots/announcement-discovery/empty-relaxation.png), [상세 지원 준비](../screenshots/announcement-discovery/detail-actions.png), [비교](../screenshots/announcement-discovery/compare.png).
- 실제 화면에서 찾은 문제: 비교 표 첫 열 머리글의 `sr-only`는 `AnnouncementHeader`의 scoped 스타일에만 있어 화면에 그대로 보였다. 의미가 있는 머리글이라 '항목'을 보이는 머리글로 바꾸고 E2E 기대값에 넣었다. 이 수정 뒤 `npm run verify -- --headed`를 다시 실행해 성공했다(unit 429, browser 270).

### 공용 화면 전용 텍스트(`sr-only`)

- 실제 화면 검증에서 발견했다. `.sr-only`는 여러 컴포넌트(`AnnouncementHeader`의 legend, `AdminCollection`의 검색 label)가 쓰는데, 정의는 `AnnouncementHeader`의 scoped 스타일에만 있었다. 그래서 운영 목록의 '제목·작성자 검색' label이 화면에 그대로 보였다.
- Red: `admin.spec.js`에서 운영 공고·질문 목록 검색 label의 면적이 1px² 이하인지 확인했다. production·development 모두 실패했다(Received 5243.75).
- Green: 규칙을 `main.css`의 공용 utility로 옮기고 scoped 중복 정의를 지웠다. 접근성 이름(`getByLabel`)은 유지된다. `admin.spec.js`·`announcement-filters.spec.js` 64건이 통과했다. 새 E2E는 필수 목록에 등록했다.
