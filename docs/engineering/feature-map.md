# 기능 지도

| 기능 | 사용자 경로 | UI 상태 소유자 | 검증 |
|---|---|---|---|
| 질문·답변 반응 | `/questions/-1` → 추천/비추천 → 새로고침 | `useContentReaction` (readonly 상태·선택 명령) | 타입 부정 계약/Vitest/개발·배포 Playwright + 현재 세션 실제 Spring 브라우저 |
| 답변 페이지·단건 저장 | 질문 상세 → 첫 20건 → 더 보기·작성 → 저장 → 새로고침 | `useQuestionAnswers` (readonly 목록·커서·입력·요청 세대) | 공개 상태/컴포넌트 테스트 + 두 Playwright 프로젝트 + 실제 Spring 화면 |
| 태그 입력·선택 필터 | 질문 작성/편집 → 태그 추가·삭제, 상세 태그 → 목록 → 조건 해제 | `Hashtags` 입력 상태, 목록 필터의 원본은 route query | Vitest·CI 반응형 회귀 + 현재 cmux의 실제 클릭·간격 assertion |
| 본인 질문 편집 | `/questions/:questionId` → 편집 → `/questions/:questionId/edit` → 저장·재조회 | `QuestionWrite` 조회/입력/저장 및 요청 세대, 서버가 작성자 권한 소유 | Vitest·CI development/production fixture + 실제 Spring/H2 저장·반응 보존 |
| 관리자 footer | 비회원·일반회원 숨김 → 서버 `/api/admin/me` 성공 후 표시 → 로그아웃 숨김 | `useAdminAccess` readonly 판정, 서버가 최종 관리자 권한 소유 | `AppAdminAccess.spec.js` 지연 응답 포함 + 실제 cmux 세 역할 |
| 채용 고용 형태 | 관리자 등록/수정 → 미확인·정규직·계약직·두 인턴 선택 → 목록·상세 재조회 | `AdminAnnouncementEditor` 입력, 서버 Announcement 상태 규칙, `AnnouncementAudience` 공통 표현 | 단위·CI fixture + 실제 cmux 저장/조회; backend 실제 MySQL 25 assertions |
| 기술 스택·변경 이력 | 전체 선택 칩 클릭 → 저장/재조회, 이력 보기 → 날짜/작성자/상태·제목 | 기존 native checkbox와 관리자 editor; history는 서버 순서 그대로 표현 | 단위·CI 반응형 회귀 + cmux 320/390/1440px 치수/화면 |
| 공고 검색 필터 | `/` → 직무/기술 검색·선택 → 모집 상태/정확한 경력 → 조건 해제·뒤로 이동 | route query가 적용 조건의 원본, Header가 검색/연차 초안·단일 패널을 소유 | `AnnouncementFilters`/`AnnouncementFilterPanels` + development/production CI + 실제 cmux/Spring 결과·6개 폭 |
| 공고 카드 밀도·회사/직무 | 목록 → 회사/직무·제목·모집/고용·기술/마감 → click/Enter 상세 → 목록 복귀 | `AnnouncementList` 기존 조회/페이지/상세 이동, card scoped CSS 표현 | `AnnouncementPresentation` + 6개 폭 CI/실제 cmux의 56px 이미지·글자 크기·간격·자연 줄바꿈; [기록](../announcement-card-density.md) |
| 반응형 간격·텍스트 표시 | 공고 목록·상세, 질문 목록·상세·작성, 인증, 관리자 목록·등록 | 공통 CSS + MarkdownEditor 내부 CSS | `responsive-layout.spec.js` + Codex 실제 로컬 화면 |

## 답변 페이지·저장

부모 `views/question/QuestionDetail.vue`는 route의 질문 ID와 인증 store의 username을 props로 전달한다. `QuestionAnswer.vue`는 렌더링과 입력/클릭을 맡고, `useQuestionAnswers`가 초기 조회·더 보기·저장·오류·질문 이동을 조정한다. `answers.ts`는 페이지 GET과 객체 1건 POST를 담당한다.

더 보기와 저장은 각각 연타를 막으면서 동시에 실행할 수 있다. 응답 도착 시 현재 목록에 ID 기준으로 병합해 저장한 답변·이미 표시한 반응을 보존한다. 저장 성공에만 해당 입력을 비우며, 더 보기 실패에는 목록·입력·커서를 유지해 같은 커서로 재시도한다. 질문 이동/unmount는 이전 세대의 응답을 버린다. 화면 개수는 전체 건수가 아닌 ‘표시된 답변’이다. `data-test="answer-load-more"`와 `answer-more-error`가 더 보기의 안정적인 selector다.

## 질문·답변 반응

`QuestionDetail.vue`/`QuestionAnswer.vue`는 대상과 현재 수치를 `ContentReactionControl`에 건넨다. `ContentReactions.vue`는 버튼과 이벤트만 담당한다. `useContentReaction.ts`가 저장 중 차단·확정된 값·실패 안내·화면 이동 후 지연 응답 폐기를 맡고, `src/api/reactions.ts`가 PUT을 수행한다. 최종 회원별 값과 집계의 소유자는 서버 `ContentReactionService`/DB다.

전제: local Spring/H2 + Vite 개발 서버 + 일반 회원 로그인. 안정적인 selector는 `button[aria-label^="추천"]`, `button[aria-label^="비추천"]`, `aria-pressed`다. 같은 버튼을 다시 눌러 취소하고 새로고침 후 유지되는지 확인한다. 저장 실패에는 오류 안내와 재시도가 필요하다.

`npm run verify -- --headed`는 화면·상태 단위 테스트, 타입·경계·lint·build와 API fixture를 이용한 development/production 브라우저 흐름을 실행한다. 예상하지 않은 Vue 경고는 단위·브라우저 검사 모두 실패이며, 각 브라우저 흐름의 빈 경고 수집 증거를 확인한다. 실제 Spring 저장은 사용자가 지정한 현재 세션의 브라우저에서 별도로 검증한다. 구체적인 시작·종료·근거: `.agents/skills/verify-dempfrontend/SKILL.md`, [CI 운영](ci-and-delivery.md), 백엔드 지도: [DEMP 기능 지도](https://github.com/seungmin-park/demp/blob/main/docs/engineering/feature-map.md).

## 반응형 간격 검증

320·390·640·768·1024·1440px에서 가로 넘침, 입력 폭, 버튼 간격, 긴 텍스트의 줄바꿈, 짧은 본문의 높이를 확인한다. `npm run verify -- --headed`로 build와 전체 화면 검사를 실행한다. API fixture에 기반한 화면 검증이며 서버 저장 검증이 아니다. 실행 근거와 실제 화면 확인은 [화면 간격 작업 기록](../responsive-spacing-verification.md)에 있다.

## 계정별 로그인 제한

`/login` → 기존 계정의 15분 내 실패 5회 → 429·Retry-After → 입력 보존·대기 안내. 최종 제한 상태는 Member DB, 인증/commit은 MemberService, 표시 상태는 LoginForm이 소유한다. 정상 로그인·시간 경계·DB 재조회·동시 요청·두 독립 컨텍스트·HTTP/CORS·단위/개발·배포 브라우저와 실제 Spring 화면을 함께 검증한다.
