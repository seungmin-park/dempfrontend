# Vue/TypeScript CI와 보호된 자동 머지

## 목적과 작업 환경

Phase: 프런트 CI 검증·전달 기반 보강. 브랜치 `refactor/frontend-ci-and-protected-delivery`, worktree `/Users/seungmin/Desktop/repo/archive/dempfrontend/.worktrees/frontend-ci-and-protected-delivery/frontend`. 기준 `9ef47e406eaa49cd84cb62017e3e85fef1c7923e`, Node 24.21.0. 원본 main의 반응형 UI 미커밋 변경은 사용자 작업으로 보존한다.

사용자 승인 범위: TS/Vue에 맞는 보강, CI 적용, PR 및 자동 머지 활성화·머지. 현재 Codex 세션에서 검증한다는 사용자 지시가 cmux 표시 방식보다 우선한다. API fixture 브라우저 테스트와 실제 Spring/H2 저장 확인을 구분한다.

## 조사와 설계

- Vue 공식 문서: Vite의 변환·빌드는 타입 검사가 아니므로 `vue-tsc --noEmit`을 유지한다. Vitest는 렌더링·이벤트·상태 계약, Playwright는 production build 화면을 확인한다.
- 기존 regex 검사기는 namespace/dynamic import와 views 경계를 놓친다. Vue SFC의 script와 TypeScript AST에서 실제 의존성을 읽는다. 타입 전용 import는 허용한다.
- 상태 소유자는 `useContentReaction`, HTTP 전송은 API 모듈이다. 컴포넌트/뷰의 직접 transport 접근, 다른 반응 쓰기 진입점, composable/API의 화면 역참조를 거절한다. 일반 API wrapper 이용은 유지한다.
- `npm run verify`가 경계 → 타입 → 전체 단위 테스트 → lint → build → 새 preview 서버의 Playwright → 보고서·산출물 검사를 순서대로 실행한다. 빈·누락·skip·flaky 결과는 성공으로 처리하지 않는다. 포트는 작업별로 분리한다.
- CI는 고정 SHA의 Actions, 최소 권한, 실패 시에도 증거 보관, 취소·시간 제한을 사용한다. main 필수 검증과 관리자 적용을 설정한 후 해당 PR의 squash 자동 머지를 사용한다.

책임: `source-boundaries`는 소스 의존성, `verify-results`는 실행 보고서·dist 계약, `verify`는 실행 순서·로그, GitHub 보호 규칙은 main 반영 조건을 소유한다. 코드의 모든 의미·간접 호출·전체 요구사항 완전성을 AST나 결과 수로 증명하지 않는다.

## 진행·검증 기록

1. 기준 전체 Vitest: `asdf exec npm test -- --reporter=json --outputFile=/tmp/dempfrontend-ci-baseline-unit.json`, 40 files / 156 assertions, 실패·skip 0, 종료 0.
2. Red: 실제 잘못된 import와 보고서/서버 계약 실패를 확인한 뒤 구현한다. 후속 실행 결과는 아래에 기록한다.
3. Green/Refactor: 기존 CLI의 버전 검사와 probe를 유지하며 책임별 모듈로 나눈다. Vue UI와 production 반응 로직은 변경하지 않는다.
4. 완료 근거: 현재 소스 전체 verify, headed E2E, 현재 세션 실제 Spring/H2 화면, 고의 위반 거절, PR 보호 규칙·자동 머지·머지 후 main CI를 기록한다.

조사 링크와 운영 절차는 `docs/engineering/ci-and-delivery.md`에 기록한다.

## 실제 Red → Green → 검증

- 경계·실행 설정 Red: `asdf exec npm test -- tests/unit/AgentContracts.spec.js tests/unit/PlaywrightExecution.spec.js`, 종료 1, 15 assertion 실패/4 통과. namespace/dynamic/re-export/script src·views·직접 transport·역참조 누락, 주석 오인, 지정 포트 무시·기존 개발 서버 재사용이 원인이다. `/tmp/dempfrontend-ci-red-boundaries.log`.
- 보고서 Red: 같은 방식의 `tests/unit/CiVerification.spec.js`, 결과 계약의 no-op scaffold에서 종료 1, 19 assertion 실패/1 통과. 빈·누락·skip·실패·재시도·집계 불일치와 dist 파일/개발 경로/fixture 토큰을 거절하지 않는 것이 원인이다. `/tmp/dempfrontend-ci-red-results.log`. import/컴파일 오류를 Red로 사용하지 않았다.
- Green: 세 파일의 39 assertion 모두 통과. SFC/AST 의존성 모듈, 실제 결과 계약 모듈, 순서·로그 실행 모듈로 책임을 분리했다. 기존 UI/API 제품 동작은 변경하지 않았다. E2E의 고정 origin만 baseURL에 연결하며 원문 이동·본문 표시 등 assertion을 유지했다.
- 첫 전체 실행은 195 unit/20 headed E2E가 통과했지만 실행 중 CI 파일을 수정해 source digest 불일치로 종료 1을 기록했다. 이를 최종 통과로 쓰지 않았다.
- 변경 완료 후 `asdf exec npm run verify -- --headed`: 모든 단계 종료 0, 43 unit files/195 assertions, production Chromium 20 흐름, skip/retry/failure 0. `.verification/summary.json`, unit/e2e JSON, 단계 로그. 입력 source SHA256 `82da4adf6d394f0b393045e2e845edf2da966ef98dbebb40973f4beeeaaad3b8`, 41개 dist 파일 digest `c995abbd1510ea376e8c4e168fa76b2797bfc54bf98786151029088e7252a062`.
- 실제 `src/components/__CiBoundaryProbe.vue`에 namespace 반응 import를 임시 추가: 검사 종료 1, `reaction owner` 위반 확인 후 삭제. 실제 unit JSON에서 ContentReactionControl 결과를 제거한 사본: `Missing required unit file` 거절. `/tmp/dempfrontend-ci-rejected-source.log`.
- 문서 로컬 링크 17개와 diff 공백 검사 통과. 별도 actionlint는 설치되어 있지 않아 사용하지 않았으며 GitHub의 실제 workflow 실행으로 확인한다.
- 기존 단위 fixture의 router-link/props 경고는 로그에 남아 있다. assertion 실패·skip으로 바꾸어 숨기지 않았고 이번 범위의 제품 수정으로 확대하지 않았다.

## 현재 세션의 실제 Spring/H2 화면

검증한 dist preview 5052 → 세션에서 만든 격리 backend 18082, backend HEAD `d6a3146ffa9d7491acdcabfd5665afc710798f14`. 사용자가 요청한 현재 Codex 브라우저에서 로그인 → 질문 추천·답변 반응 전환 → reload → 질문 비추천·답변 취소 → reload → 질문 취소·답변 비추천 → reload를 수행했다. DOM label/aria-pressed/disabled assertion 6단계 통과. 새 인증·HTTP 조회에서 질문 0/0/NONE, 답변 0/1/DISLIKE 일치. 제공 HTML은 검증 dist/index.html과 byte 일치.

독립 HTTP 확인기에서 처음 JSON 로그인과 Bearer 헤더를 잘못 사용해 각각 401을 받았다. 기존 form 로그인/X-AUTH-TOKEN 계약을 읽고 확인기를 바로잡은 뒤 통과했다. 실제 브라우저 로그인은 처음부터 성공했으며 제품 코드는 바꾸지 않았다. `/tmp/dempfrontend-ci-live-verification.json`, `/tmp/dempfrontend-ci-live-dom.json`, `/tmp/dempfrontend-ci-live-verified.jpg`에 기록했다. preview/격리 backend는 사용자 확인을 위해 유지한다. 원본 main의 미커밋 UI 변경은 보존한다.

## 이름·책임·공개 계약 리뷰

`inspectSourceBoundaries`는 소스 읽기와 위반 수집, `validateUnitReport`/`validateBrowserReport`/`validateBuild`는 결과 계약, `verify`는 실행·증거 수명만 담당한다. 새로운 추측성 클래스/인터페이스는 만들지 않았다. Vue는 props/event 및 상태/API 경계로 검토하며 TS의 반응 대상 타입 import를 유지했다. 기존 클래스·API DTO·JSON 필드·라우트·DB·제품 이름은 변경하지 않았다. transport와 상태 소유권 규칙의 간접 우회 한계는 운영 문서에 명시했다. 변경한 Playwright 호출부의 fixture·원문 URL 계약은 전체 20 assertion 흐름으로 확인했다.

GitHub 전달 결과는 PR와 실제 CI/설정 조회 결과를 최종 작업 증거에 남긴다. 보호를 우회하지 않고 정확한 head의 native auto-merge를 사용한다.
