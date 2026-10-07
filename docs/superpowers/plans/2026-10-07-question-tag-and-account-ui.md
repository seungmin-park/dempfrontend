# 질문·태그·계정 표시 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. 사용자 요청대로 이 세션에서 순차 TDD로 실행한다. 18:32 사용자의 PR·CI·merge 관리 요청에 따라 최종 검증과 리뷰 후 보호된 전달까지 추적한다. 실제 배포와 DB 운영 적용은 별도 범위다.

**Goal:** 승인된 태그 입력 정렬, 선택 필터 표시, 본인 질문 편집, 관리자 전용 footer, 분 단위 모집 시각, 별도 고용 형태·기술 스택 칩·변경 이력을 구현하고 보호된 PR 전달까지 확인한다.

**Architecture:** 질문 편집은 기존 작성자 검사 PATCH API를 사용한다. 필터의 원본은 route query, 관리자 판정의 원본은 `/api/admin/me`이며 화면은 이 상태를 표시한다. 날짜 입력은 시·분으로 표시하되 수정하지 않은 기존 서버 값은 보존한다.

**Tech Stack:** 기존 Vue 3·TypeScript·Vitest·Playwright와 실제 Spring/H2, cmux browser.

**Spec:** 2026-10-07 대화에서 승인한 짧은 설계와 사용자 ‘초까지는 필요 없잖아’ 요청.

## Global Constraints

- Phase: 질문·태그·계정 UI. Branch: `refactor/question-tag-and-account-ui`.
- Worktree: `/Users/seungmin/Desktop/repo/archive/demp/.worktrees/question-tag-and-account-ui/frontend`.
- 기존 사용자 본문/생성 제한을 추가하지 않는다. 서버의 작성자 권한 검사를 최종 권한으로 유지한다.
- Chrome for Testing을 로컬 화면 검증에 사용하지 않는다. 현재 cmux workspace의 보조 pane과 browser를 사용한다. Playwright CI 회귀 검증은 유지한다.
- UI 동작은 production 변경 전 실제 assertion 실패를 확인한다. 문서/계획만으로 완료 판정하지 않는다.
- 18:04 추가 설계 승인: 모집 대상과 별개로 미확인(null)·정규직·계약직·전환형 인턴·체험형 인턴을 저장/공개 표시한다. 기술 스택 선택 칩도 승인됐다.
- 18:13 순차 진행 지시: 현재 질문 편집을 끝낸 뒤 footer, 공고 고용 형태/스택, 변경 이력, 시장조사/필터 순으로 진행한다. 새 요청은 대기 목록에만 추가한다.

## Review Focus

- 로그아웃 후 늦게 도착한 관리자 응답: footer가 다시 나타나지 않아야 한다.
- 뒤로/앞으로 이동 및 URL 직접 진입: 선택 태그 표시와 checkbox가 조회 조건과 일치해야 한다.
- 질문 저장 실패: 제목·본문·태그가 유지되고 중복 저장을 막아야 한다.
- 타인 질문과 403: 편집을 허용하지 않으며 서버 실패를 성공으로 표시하지 않는다.
- 기존 날짜의 초 및 태그 여러 줄: 날짜는 기존 정밀도를 보존하고 태그/오류/도움말은 겹치지 않아야 한다.

## Task 1: 실행 기반과 분 단위 날짜

Files: `tests/unit/AdminOperations.spec.js`, `src/views/admin/AdminAnnouncementEditor.vue`.

- [x] `npm ci`, `npm test`로 현재 main의 baseline을 확인한다. 235/235, exit 0.
- [x] 기존 초 포함 날짜의 표시 테스트 Red: 17:56:53 ≠ 17:56, exit 1. 보존/수정 계약을 함께 검증했다.
- [x] `datetime-local`의 step을 60으로 설정하고 표시와 저장값을 분리한다. 사용자가 바꾼 값만 갱신한다.
- [x] 기존 공고 등록/수정/실패 및 전체 252/252 통과. 실제 cmux의 두 날짜 값은 16자·step 60·stepMismatch false였다.

## Task 2: 태그 입력과 선택 필터

Files: `Hashtags.vue`, `QuestionControl.vue`, 질문 목록 view, 해당 unit suites.

- [x] 초기 태그·비활성·접근 가능한 오류 연결의 3개 실패를 확인하고 4/4 통과했다.
- [x] 입력/태그를 flex 정렬하고 오류를 정상 흐름에 둔다. 편집 초기 태그와 저장 중 비활성을 지원한다.
- [x] URL 표시/선택 동기화와 저장 중 비활성의 3개 실패 후 관련 13/13 통과했다.
- [x] route query에서 표시 상태를 도출하며 checkbox와 브라우저 이동을 동기화한다.
- [x] cmux 중복 오류: gap -11px/중심 -3px → gap 9px/중심 0px. 실제 태그 클릭/선택 표시/해제 assertion 통과. 여러 줄은 최종 viewport 검사에 남는다.

## Task 3: 본인 질문 편집

Files: `src/api/questions.ts`, `src/types/api.ts`, `QuestionDetail.vue`, 새 편집 view/component, `src/router/index.ts`, unit/E2E suites.

- [x] 본인 링크/초기 복원/PATCH/타인 진입의 4개 실패 → 대상 11/11 통과.
- [x] `updateQuestion` HTTP 경계를 추가하고 기존 Markdown 변환 및 Hashtags 계약을 재사용한다.
- [x] 조회/저장 지연 응답 이동 계약을 추가 확인했다. 전체 unit 248/248, typecheck exit 0.
- [x] cmux 실제 Spring/H2에서 편집·PATCH·새로고침으로 제목/서식/태그 및 질문/답변 반응 보존을 확인했다. 403은 단위 API 경계, 타인 실제 화면은 다음 관리자 검증에서 확인한다. CI fixture 회귀도 추가했으나 로컬 Chrome 러너는 실행하지 않았다.

## Task 4: 관리자 footer 판정

Files: `src/App.vue`, 새 `src/composables/useAdminAccess.ts`, unit suites.

- [x] 비회원·일반 회원에게 숨김, 서버 성공 후 표시, 로그아웃 및 늦은 응답 무시의 4개 의도한 실패 후 관련 7/7 통과. mock 반환 함수가 hook cleanup으로 실행되는 테스트 오류는 먼저 수정했다.
- [x] 기존 `fetchAdminIdentity`로 인증 상태를 검증하고 App은 읽기 전용 판정만 표시한다.
- [x] 전체 unit 252/252, typecheck/contracts·probe/lint/build exit 0. 실제 비회원/일반회원 숨김·관리자 표시·관리자 로그아웃 초기화를 확인했다.

18:26 검증: 전체 unit 252/252, typecheck·contracts/probe·lint·build exit 0. cmux 실제 Spring/H2에서 비회원/일반회원 숨김·관리자 표시·로그아웃 초기화를 확인했다. 관리자 계정의 일반 질문 편집 GET은 서버 403으로 거절되었으며 권한 안내와 form 숨김을 assertion으로 확인했다. UI 본인 비교와 실제 서버 403은 구분한다. CI fixture 브라우저는 미실행이다.

## 검증과 전달

추가 승인 작업도 이 Phase에서 아래 순서로 실행한다.

## Task 5: 별도 고용 형태

- [x] Backend: multipart의 4개 고용 형태·생략 null·잘못된 값 400의 6개 Red → enum/입력 계약 Green.
- [x] DB/domain/service: 신입·경력과 독립 저장, 관리자 수정·교육 전환, 목록·상세·스크롤 반환 및 legacy의 7개 Red → Green. 전체 verify 390건 통과.
- [x] Frontend: null 및 4개 선택지 복원·저장·실패 보존, 공개 목록/상세/관련 표시 12개 Red→29/29 Green. 전체 unit 264/264·typecheck exit 0.
- [x] 기존 수동 SQL 방식으로 nullable VARCHAR 컬럼을 추가했다. H2 legacy 데이터/null/validate·실제 MySQL 25개 assertion과 SQL 누락 기동 거부 통과. 자동 migration은 없다.
- [x] 확인된 새 backend JAR f38cc4c1…로 현재 cmux 수정/재조회 및 공개 목록→상세에서 신입+전환형 인턴을 확인했다. 새 등록 네 값은 실제 MySQL HTTP/DB로 검증했고 기존 반응은 backend 전체 verify의 실제 commit/switch/cancel을 통과했다. 최종 브라우저 반응 재확인은 남긴다.

## Task 6: 기술 스택 선택 칩

표현 설계: 기존 DEMP primary/soft·ink·line·surface 토큰과 기존 본문 글꼴을 유지한다. 체크박스와 기술명을 왼쪽 정렬하고 선택만 primary로 강조한다. 새로운 카드/장식/동작을 추가하지 않는다. 40px 높이, 내부 8px 간격과 외부 8px gap으로 클릭 영역을 만든다. CSS는 이 선택 영역에만 적용해 `.field`/`.radio-options`의 다른 간격을 덮어쓰지 않는다.

```text
기술 스택
[☑ Java] [☑ Spring] [□ JPA]
[□ HTML] [□ CSS]    [□ React]  ← 좁은 폭에서 자연스럽게 줄바꿈
```

- [x] checkbox의 기존 선택/저장 계약을 유지하며 칩 전체 클릭·선택 표시·disabled의 2개 Red→16/16 Green. native label 이벤트 검증은 실제 DOM에 attach해 실행했다.
- [x] cmux 전체 칩 클릭→Spring 선택/Java 해제→저장 재조회 통과. 320/390/1440px에서 모두 높이 40px·gap 8px·가로 넘침 없음. 전체 266/266 통과.

## Task 7: 변경 이력

- [x] 접근 가능한 이력 목록과 값/순서 보존의 1개 Red→17/17 Green. 안내용 `state-panel` 중앙 정렬을 이력 전용 section/list로 분리했다.
- [x] cmux 320/390/1440px의 실제 긴 제목·4행: 모두 왼쪽 정렬, 제목 간격 8px, 시작 위치 차이 0px, 가로 넘침 없음. 스크린샷도 확인했다.

## 최종 검증과 전달 상태

- [x] 로컬: 전체 unit 267/267, typecheck, contracts/probe, lint, build exit 0. 기존 Playwright assertions를 유지하며 320/390/1440px 이력 회귀를 추가했다. discovery는 실행 여부와 구분한다.
- [x] 현재 cmux 실제 Spring/H2: 태그 7개·320/390/1440px 여러 줄/오류/도움말, 상세 태그→필터 해제, 본인 편집→재조회·서식·질문/답변 반응 보존, 필수 제목 오류 입력 보존, 비회원/일반회원 footer 및 타인 편집 form 숨김 통과. 서버 저장 실패·지연 응답은 단위/CI API 경계 검증이며 실제 브라우저에 장애를 주입하지 않았다.
- [x] 결과·명령·Red/Green 로그·책임/이름 리뷰·검증 한계를 기록했다. Whole-phase review Important 2건과 shared client late-401 경계를 단일 TDD fix pass로 해결했다. 수정 후 271/271·types/contracts probe/lint/build exit 0. [판단 기록과 리뷰](../../question-tag-and-account-ui-verification.md)를 따른다.
- [x] 새 UI의 최종 검증·리뷰 후 commit→PR→정확한 head CI→보호된 merge→main CI까지 확인했다. 파비콘의 승인된 전달/배포는 별도 진행한다.

| 전달 대상 | commit | PR | 필수 CI | merge | main CI | 배포 |
|---|---|---|---|---|---|---|
| 기존 파비콘 | e4ae376 | frontend #7 | 37595823311 성공 | 39bc0a0 | 37596617175 성공 | GCP SSH 인증 대기 |
| 현재 backend 고용 형태 | 3204d17 | [backend #7](https://github.com/seungmin-park/demp/pull/7) | 37604415112 성공: 390·API·문서 | 13fcb24 | 37604774466 성공: 390·API·문서 | 운영 SQL 미적용 |
| 현재 frontend UI | 9e2e99bdc1b10ed31e1f2ab0ed670fab94e7a191 | [frontend #9](https://github.com/seungmin-park/dempfrontend/pull/9) | [37606082622](https://github.com/seungmin-park/dempfrontend/actions/runs/37606082622) 성공: 271 unit/186 browser | 45b30634bc33b0639595d53ea431c87ac504efa5 | [37606454585](https://github.com/seungmin-park/dempfrontend/actions/runs/37606454585) 성공: 271 unit/186 browser | 미배포 |

19:12 CI 피드백: development/production에서 계정 전환의 로그아웃 누락과 새 고용 형태를 누락한 이전 기대값이 각각 실패했다. [실제 실패와 수정 근거](../../question-tag-and-account-ui-verification.md)에 따라 테스트만 고치며 기존 편집/권한/연차 assertions는 유지한다. 첫 실패를 같은 head의 재실행으로 덮지 않고 새 head로 전체 CI를 실행한다. 중복 frontend PR #6은 변경 두 blob이 이미 #7/main에 들어 있음을 확인해 닫았다.

최종 전달: PR/main 모두 재시도·skip·실패 0, 각 browser flow의 Vue warnings 빈 배열 확인. PR head와 merge tree `b815cd2ada35c09a4cf75ac6ee1db5c6a57e4382` 일치 및 실제 artifact 검증 완료. 실행 근거는 `/private/tmp/demp-question-ui-20261007/ci/frontend-pr-fixed`, `frontend-main`과 PR #9 설명에 남겼다. 이후 필터 Phase가 이 main을 기준으로 진행한다.

## 순차 대기 목록

- 공고 검색 필터: 조사·설계 승인 완료, 별도 `refactor/announcement-filter-interactions`에서 순차 구현 중. [조사](../../announcement-filter-research.md)와 [실행 기록](../../announcement-filter-interactions.md)을 기준으로 확인한다.
- 공고 카드: 필터 조사 다음 순서. 카드마다 큰 이미지/여백을 줄이고 분야·회사·제목의 정보 순서를 검토한다. 사용자 첨부 카드에서 관찰한 문제이며 아직 구현하지 않았다.
- 조회수: 카드 다음 순서. 상세 진입 조건/증가 정책/DB 저장을 확인하고 실제 재현 후 TDD로 수정한다. 아직 원인을 조사하거나 변경하지 않았다.
- 관리자 공고 등록: 조회수 다음 순서. 사용자 추가 화면의 긴 폼을 입력 목적별 그룹·읽는 순서·간격·도움말·동작 위치로 개선한다. 아직 구현하지 않았다.
- 질문 목록 글 구분: 19:53 추가 요청. 기존 관리자 화면 다음에 행·페이지 이동 영역 경계와 제목/메타 정보 대비를 개선한다. 현재 작업을 중단하지 않는다.
