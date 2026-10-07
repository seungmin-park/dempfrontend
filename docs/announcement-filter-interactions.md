# 공고 필터 실행 기록

2026-10-07. 사용자가 대화의 짧은 설계를 승인했다. 기존 화면을 바꾸는 bounded 작업이며 별도의 명세/구현 계획을 반복하지 않는다.

Phase `announcement-filter-interactions`, branch `refactor/announcement-filter-interactions`, base `45b30634bc33b0639595d53ea431c87ac504efa5`. Worktree `/Users/seungmin/Desktop/repo/archive/demp/.worktrees/announcement-filter-interactions/frontend`. [조사 기록](announcement-filter-research.md)의 직접 관찰·정적 분석·미확인 범위를 구분한다.

전달 중 별도 CD PR #8이 main에 들어와 `a20229658b582fa3542af2ea8cc16cbcac38a458`로 fast-forward 통합했다. 제품 소스 충돌은 없었으며 CI/CD·배포 준비 파일 5개를 그대로 보존했다. 이 최신 main을 포함한 최종 head를 다시 검증한다. 기존 CD 활성화가 true여서 main CI 뒤 자동 연계된 결과도 관찰한다.

## 승인된 동작과 책임

필터 네 개의 높이/좌측 정렬/강조를 통일하고 패널은 하나만 연다. 직무·기술은 검색/native checkbox, 모집 상태는 radio, 내 경력은 양의 정수 연차와 빠른 선택이다. 선택/해제/새로고침/앞뒤 이동에서 URL을 적용된 조건의 원본으로 유지한다. 입력 중인 검색어와 직접 연차는 제출/적용 전 API 조건이나 요약에 섞이지 않는다. 모바일은 패널을 화면 안의 정상 흐름에 둔다. 서버/API/DB 계약 및 EDU 조건은 유지한다.

```text
사용자 선택 → Header 이벤트 → URL → 기존 목록/API
                              ↓
                      선택 요약·입력 복원

검색어/직접 연차 draft → 유효한 제출/적용 → URL
단일 열린 패널/항목 검색 → Header의 화면 상태
```

기존 primary `#4f46e5`, ink `#0f172a`, meta `#64748b`, line `#e2e8f0`, surface `#fff`, canvas `#f7f8fc`와 Pretendard 계열 글꼴을 유지한다. 필터 trigger는 44px 높이·14px 텍스트·같은 좌측 정렬, 목록 행은 label 전체를 눌러 선택하고 간격은 CSS gap/padding을 사용한다. 범위를 넘는 재브랜딩이나 카드 변경을 섞지 않는다.

## 실제 실행

cmux 호출 workspace `workspace:1000000002`, runner `surface:1000000006`, 기존 서버 `surface:1000000011`, 실제 browser `surface:1000000009`를 재사용한다. 명령/종료 코드/원본 로그는 `/private/tmp/demp-announcement-filter-research-20261007/`에 기록한다. 로컬 Chrome for Testing을 시작하지 않는다. fixture development/production 흐름은 CI에서 확인한다.

- `install`: npm ci exit 0. 기존 lock/tool versions 유지.
- `baseline-unit`: 변경 전 전체 271/271 exit 0.
- `search-draft-red`: 1 failure/7 pass. 제출 전 검색어가 적용된 조건 요약을 바꿨다.
- `search-draft-green`: 8/8 exit 0. 검색어 draft와 적용된 filter title 분리, 제출 시 URL 변경. `search-draft-suite` 전체 273/273 exit 0.
- `filter-panels-red`: 여섯 동작이 native disclosure button 부재로 실패. `filter-panels-green` 6/6 통과. 첫 전체 실행은 278 pass/1 failure: DOM에 붙이지 않은 기존 테스트가 바깥 클릭을 전달하지 않아 열린 패널을 다시 닫았다. fixture를 실제 DOM에 붙여 이벤트 전파를 복원했고 선택/뒤로 이동/API assertions를 유지했다.
- `career-red`: 8 failure/15 pass. 직접 입력/오류/20년 URL 복원/적용 계약 부재 및 모드 전환 후 패널 잔류. `career-green` 23/23, `career-suite` 전체 288/288 exit 0. 15년 UI 상한을 제거하되 기존 서버 Integer 계약을 유지했다.
- `old-layout-red`: 실제 기존 cmux 화면의 두 panel overlap 148.75px assertion 실패. `dimensions-red`: 새 버튼의 높이 23.328px·center 정렬 실패. CSS 적용 후 첫 검사에서 clientWidth와 요청 viewport 차이(스크롤바 17px)를 혼동했다. 기존 CI와 동일한 innerWidth 기준으로 바로잡고 `layout-green-corrected` 31 assertions exit 0: 6개 폭의 네 버튼 모두 44px/left, panel 하나/overlap 0, 화면 안, 모바일 static.
- Refactor: 필터 CSS를 Header scoped style로 모으고 기존 details/공통 popover 전역 규칙 12개 제거. shared select/page layout은 유지했다. URL 초기 파싱·모집 상태 label 중복 제거, 포커스 조회를 컴포넌트 root에 한정. `refactor-unit` 49 files/288 assertions exit 0; `panel-types` exit 0.
- 실제 cmux flow의 첫 임시 probe는 문자열 selector의 따옴표 실수로 중단했으며 제품 실패/Red로 간주하지 않는다. 수정 후 `actual-user-flow-corrected` 19 assertions exit 0: 실제 Spring 조회, 항목 검색/선택 보존, 미제출 검색어 격리, 단일 panel/Esc+포커스, 모집 상태, 잘못된 연차 유지, 7년 제외/3년 포함, reload, draft 폐기, 해제/back 결과 복원, 검색 제출/reset, EDU 전환 및 별도 HTTP 조회 ID -1.

실제 런타임은 backend main `13fcb24fc45fcb7f06c87d1390f6415144a05c80`, CI run `37604774466`의 deployment artifact JAR SHA256 `b3588c4ebc9e9fd310eb4aee1815f5dd63877da44a2ad7a68af6553ade854f05`를 component manifest와 대조했다. 새 격리 H2 `demp_filter_ui_20261007`, Spring 18081, 현재 frontend worktree Vite 51017을 사용했다. 이 화면 검증은 미커밋 작업 트리 기준이며 PR commit 증거는 아니다. 첫 API fixture browser 실행은 CI에서 별도로 확인한다.

## 책임·이름·공개 계약 리뷰

Header는 route/event와 화면 상태만 소유하고 HTTP를 가져오지 않는다. `submitSearch`, `applyCareer`, `selectCareer`, `toggleFilter`는 실제 효과를 드러낸다. 기존 `commit`은 filter를 URL에 적용하는 역할을 유지하며 DB commit이 아니다. 별도 단순 위임 composable을 만들지 않았다. 위치/기술 enum, q/status/career/EDU URL과 API 이름/직렬화는 기존 계약이다. TS URL/API 모듈의 책임·의존 방향은 그대로이며 Vue는 클래스 SOLID 점수 대신 렌더링/상태/API 경계로 검토했다. 간격은 CSS gap/padding, item label 전체 클릭, field error/help의 정상 흐름으로 소유한다. 최종 단일 reviewer 결과와 조치는 아래에 기록했다.

## 상태와 전달

첫 PR #10 CI [37610543930](https://github.com/seungmin-park/dempfrontend/actions/runs/37610543930)는 unit 288/288 및 types/contracts/lint/build 통과, browser 190 pass/2 failure였다. 두 프로젝트의 동일한 상태 선택 테스트가 `locator.check()` 후 이미 닫힌 radio를 다시 찾아 30초 시간 초과했다. 실패 DOM에는 status=OPEN의 요약과 focused trigger가 이미 있었다. 즉시 적용/닫기가 승인 계약이므로 제품을 바꾸거나 timeout/retry를 늘리지 않고 native click으로 실행한다. 기존 URL/요약/종료/focus assertions를 유지하고 패널을 다시 열어 `toBeChecked()`로 복원까지 검증한다. 원본 artifact/trace는 `/private/tmp/demp-announcement-filter-research-20261007/ci/pr-first`에 보존했다. 테스트만 수정한 새 서명 head에서 전체 CI를 확인한다.

단일 whole-phase reviewer: Critical 0 / Important 1 / Minor 1. 실제 SFC/JSDOM에서 상태 radio 선택 후 focus BODY가 재현됐다. `status-focus-red` 1 fail/14 pass 후 `closeFilter(true)` 최소 수정, `status-focus-green` 15/15 exit 0. URL/요약/패널 assertion은 유지하고 실제 focused radio와 복귀 trigger assertion을 추가했다. Minor의 초기 CI polling은 `requests.at(-1)?.career`로 빈 목록에 안전하게 대기하게 했다. 두 항목 모두 처리했으며 보류 Minor 없음. 보고서 `/private/tmp/demp-announcement-filter-research-20261007/final-review.md`.

Reviewer가 판단에서 제외한 카드·조회수·관리자 폼은 승인된 후속 순서를 유지한다. 외부 CD 구현 자체의 재설계와 운영 SQL은 이 제품 diff에 추가하지 않는다. 기존 CD 최신 main 통합/테스트·자동 연계 결과 관찰은 전달 검증으로 진행한다. 제외 항목을 해결 완료로 보고하지 않는다.

로컬 구현/검증 완료: 49 unit files/288 assertions, types/contracts의 실제 위반 probe/lint/build exit 0. 현재 빌드의 실제 cmux preview에서도 Spring 사용자 흐름 19 assertions와 6개 폭 치수 31 assertions exit 0. `browser-discovery`는 development/production 총 192 tests를 찾았으며 fixture 러너 실행 통과로 간주하지 않는다. runtime dev/preview 식별 기록과 명령/결과는 위 evidence 폴더에 남겼다.

최신 main 통합/리뷰 수정 후 `integrated-unit` 288/288, types/contracts probe/lint/build, 최종 cmux 빌드 흐름 19건·치수 31건 모두 exit 0. 새 main의 CD 계약 테스트 5건도 exit 0. 최종 책임 리뷰는 완료했고 PR→정확한 head CI→보호된 merge→main CI는 전달 단계에서 확인한다. 이 문서는 커밋 전 로컬 검증 시점이며 최종 전달 ID/결과는 PR 설명에 갱신한다. 이전 Phase의 frontend #9/main은 현재 변경을 증명하지 않는다. 수동 운영 SQL/UI 배포는 실행하지 않았고 기존 자동 CD는 main CI 뒤 관찰한다.

기존 작업 완료 뒤 필터→카드 밀도/회사·분야 시인성→조회수 재현/수정→관리자 공고 등록 화면을 순차 진행한다. 새 요청으로 현재 작업을 버리지 않는다.

19:53 추가 요청: 질문 목록의 아티클 구분 시인성. 글 행과 페이지 이동 영역의 경계, 제목/메타 정보 대비를 기존 관리자 화면 다음 순서에 추가했다. 이번 필터 제품 변경에는 섞지 않았다.

후속 Phase 시작 시 확인: [PR #10](https://github.com/seungmin-park/dempfrontend/pull/10)은 main `a26c416461ed082da145205197ee986c55900c66`에 머지됐다. [main CI 37611794128](https://github.com/seungmin-park/dempfrontend/actions/runs/37611794128)은 288 unit/192 browser 통과 및 artifact identity/hash 검증 exit 0, [자동 CD 37612159811](https://github.com/seungmin-park/dempfrontend/actions/runs/37612159811) 성공, 공개 cmux 필터 흐름 12 assertions exit 0이다. [카드 Phase](announcement-card-density.md)부터 기존 순서를 이어간다. 직무·기술 분류 확장은 질문 목록 다음 순서로 추가했고, 관리자 폼에는 기존 native 달력 디자인 개선을 포함한다.
