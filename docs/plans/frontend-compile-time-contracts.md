# 컴파일 계약과 Vue 경고 실패 처리

Phase: Vue/TS 컴파일·경고 검증 보강. 브랜치 `refactor/frontend-compile-time-contracts`, worktree `/Users/seungmin/Desktop/repo/archive/dempfrontend/.worktrees/frontend-compile-time-contracts/frontend`, 기준 `58ef686ee7ab3c367dfa46e7293f843c22ddd2f1`. 기존 CI/검증 체계를 확장하고 현재 Codex 세션에서 headed 검증한다.

사용자 요구: 프런트 컴파일을 강하게 검증하고 `[Vue warn]`도 엄격히 처리한다. 현재 모든 src script는 TS지만 `strict` 외의 인덱스·선택 속성·반환·템플릿 검사가 약하며 반응 ref를 호출자가 수정할 수 있다. 컴파일·단위·개발 브라우저의 서로 다른 관찰 범위를 연결한다.

계획: (1) 잘못된 호출/상태 쓰기를 거절하는 실제 타입 Red, (2) TS/Vue 엄격 옵션과 읽기 전용 반응 상태·UI 선택 명령, (3) 일반 build에서 타입 검사 필수, (4) 단위 테스트 Vue 경고를 실패로 처리하고 원인을 수정, (5) 같은 Playwright 사용자 흐름을 development/production에서 실행하며 Vue 경고를 수집·실패 처리, (6) 실제 위반 probe·전체 검증·보호된 PR/자동 머지.

단위 fixture의 router 경계를 보완하되 실제 라우팅 assertion은 유지한다. Options API/Composition API를 일괄 교체하지 않는다. 강제 캐스팅·any·주석 suppress로 실패를 없애지 않는다. 부모 props/선택 속성의 의미를 확인하고 실제 absent/undefined 계약을 맞춘다. 네트워크 응답·영속성·비동기 경쟁은 컴파일만으로 증명하지 않는다.

실제 Red/Green/Refactor·검증 결과와 책임/이름 리뷰를 후속 기록한다.

## 실제 실패와 최소 변경

- 타입 Red: `npm run typecheck`가 10개 TS2578로 exit 2. 금지해야 할 NONE 선택, 외부 state/saving/error 쓰기, 인덱스 누락, 선택 속성 undefined, 반환 누락, switch fallthrough를 기존 설정이 허용했다. `/tmp/dempfrontend-compile-red.log`.
- Green: 엄격 TS/Vue 옵션, `ReactionChoice`, readonly 반환. 타입 검사가 exit 0이며 부정 계약을 모두 실제 거절한다. 일반 build에 임시 잘못된 Vue prop/상태 쓰기를 넣은 probe도 TS2322/TS2540, exit 2로 Vite 산출물 생성 전에 중단했다. `/tmp/dempfrontend-build-compiler-probe.log`; 임시 파일은 삭제.
- Vue warning Red: 실제 잘못된 Number prop을 mount한 gate assertion이 실패. 전체 적용 직후 14개 기존 Vue 경고 실패가 나타났다. router 경계를 분리한 단위 테스트만 명시적으로 RouterLink를 stub하고, required username/집계를 API 예제에 보완했다. 라우팅·반응·XSS assertion은 유지했다. 네트워크 socket 제한으로 생긴 2개 환경 timeout은 Vue 경고 실패와 구분하고 허용된 실행 환경에서 재검증했다.
- 전체 gate 실제 probe: 잘못된 prop 렌더링 및 readonly 객체 쓰기 각각의 본문 assertion은 만족해도 afterEach가 Vue 경고로 실패(2 failed, exit 1). `/tmp/dempfrontend-global-vue-warning-probe.log`; 임시 파일은 삭제. console 경고를 출력하면서 실패를 기록한다.
- 개발 프로젝트/경고 증거 Red: 기존 보고서 검사기가 개발 프로젝트 또는 경고 수집 증거 누락을 성공으로 받는 assertion이 실제 실패했다. `/tmp/dempfrontend-dev-gate-red.log`, `/tmp/dempfrontend-warning-evidence-red.log`. 각 필수 흐름이 production/development에 있고 모든 테스트에 정확히 하나의 빈 경고 JSON이 있어야 성공이다. 기존 반응·공고·관리자 흐름에 responsive 60개도 필수 계약에 추가했다.
- 첫 전체 실행: 컴파일·199 단위·lint·build 성공, 브라우저 158 passed/2 failed. 배포 80개는 통과했지만 개발 공고 상세에서 AnnouncementAudience에 숫자 0/boolean true가 전달되는 Vue 경고를 수집했다. 관리자 fixture의 `/api/announce/scroll`이 배열 대신 `{content, number, last}`를 반환했기 때문이다. 백엔드 Controller가 `List<AnnouncementScroll>`을 반환하는 근거를 확인하고 해당 fixture를 빈 배열로 수정했다. 경고 무시/prop 타입 완화 없이 기존 UI assertion을 유지했다. `/tmp/dempfrontend-development-warning-red.json`과 `.log`에 실제 실패 보존.

## 책임·이름·공개 계약 검토

- 선택 명령은 `ReactionChoice`, 서버 상태는 `ReactionType`로 구별한다. 상태 결정·요청 경합·저장 실패는 기존 composable에 유지하고 UI에는 readonly 참조와 select만 공개한다. API의 NONE 토글·라우트·JSON/DB 필드는 바뀌지 않는다. 기존 사용자 반응 전환·취소·늦은 응답·재시도 tests를 유지했다.
- Header 등록을 App의 로컬 import로 옮겨 컴파일러가 실제 사용 컴포넌트를 확인한다. template 이름/경로·기존 라우팅 동작은 유지한다. 편집기는 준비 전 undefined를 전달하지 않으며 body-images는 자식의 출력 event 계약대로 연결한다.
- 선택 속성이 없는 API 요청은 실제로 속성을 생략/delete한다. 읽는 form props에 필요한 undefined만 명시적으로 허용한다. 네이티브 속성을 전달하는 VeeValidate의 published type 누락은 원래 컴포넌트/props/events를 유지하는 작은 타입 어댑터로 보완한다. 무제한 unknown attribute 허용이나 any 추가가 아니다. 허용/거절 타입 계약과 기존 폼 입력·제출 E2E가 검증 경계다.
- 인덱스 접근은 조회한 tag가 있을 때만 처리하며 query/route 누락의 기존 빈값 의미를 타입에 표현한다. 반환 누락을 명시적인 undefined로 정리한다. 독립된 위임 클래스/일괄 Composition API 전환/추측 인터페이스를 만들지 않는다.
- 경고 소유자는 단위 test setup 및 공통 Playwright fixture, 성공 여부 소유자는 report validator이다. Vue 컴포넌트는 props/event·렌더링 경계, TS 모듈은 공개 계약·의존성 방향으로 평가했다. 새로운 테스트 이름은 실제 실패 조건을 설명한다.

컴파일은 실행 전 잘못된 호출을 거절하며, Vue 경고는 실제 실행한 화면 경로를 보완한다. API fixture의 오류를 서버 영속성 증거로 표현하지 않는다. 최종 전체 검사, 실제 Spring/H2 화면, PR/main CI 결과를 아래에 추가한다.

## 결과 형식과 타입 우회 추가 검증

첫 160개 브라우저 assertion은 모두 통과했지만 추가 report 검사기가 두 프로젝트의 같은 spec을 중복으로 거절했다. 실제 Playwright JSON은 프로젝트별 suite로 분리된다. 이 형식의 통과와 같은 프로젝트의 중복 거절을 먼저 regression assertion으로 작성해 1 failed/22 passed를 확인했다(`/tmp/dempfrontend-project-report-red.log`). projectName+file+title을 결과 identity로 사용하도록 최소 수정하고 23 tests 및 실제 160개 JSON 보고서 검사를 통과했다. 이 단계의 common verify exit 1은 성공으로 취급하지 않는다.

사용자 추가 요구: any로 타입 오류를 우회하지 않는지 확인. 앱 src에는 명시적 any·ts-ignore·ts-nocheck가 없고 문자열/CSS의 any는 타입이 아니다. 임시 explicit any 파일의 실제 ESLint exit 1, implicit any 매개변수의 vue-tsc TS7006 exit 2를 확인했다(`/tmp/dempfrontend-any-bypass-lint-red.log`, `/tmp/dempfrontend-implicit-any-probe.log`). 임시 파일은 삭제했다. 기존 lint가 설명 있는 ts-expect-error는 허용하므로 앱에서는 이 지시어도 금지하도록 먼저 실행 가능한 4가지 lintText assertion을 만들었다. 1 failed/3 passed를 확인한 뒤 src TS/Vue의 no-explicit-any 및 ban-ts-comment를 명시하여 4가지 모두 실제 거절한다(`/tmp/dempfrontend-type-bypass-policy-red.log`, `-green.log`). 컴파일 부정 계약만 있는 tests/types에는 의도적인 ts-expect-error를 유지한다. DOM event와 검증한 외부 library 속성의 좁은 type assertion을 무제한 타입 우회와 동일시하지 않으며, 라이브러리 보완의 허용/거절 계약을 유지한다.

## 최종 로컬 검증

`asdf exec npm run verify -- --headed` exit 0: 경계/probe·vue-tsc·45 unit 파일의 204 assertion·lint·prebuild·build·development/production의 160 브라우저 test 모두 통과. 각 프로젝트에서 필수 80 흐름을 확인하고 160개의 vue-warnings attachment가 모두 빈 배열이다. skip/retry/flaky 0, source/build 실행 전후 일치. 로그 `/tmp/dempfrontend-compile-verify-final.log`, 실제 JSON은 worktree `.verification/summary.json`, `unit.json`, `e2e.json`. 이 검증은 현재 Codex 세션에서 headed로 진행했다.

최종 source SHA256 `996c962abfd1287a77ff745285030397c01b25751b5e032ce0089b6a4842faee`, build SHA256 `051062b77b52a4ecc479af7127031bc462a68e3852767337b53f01bc97fd3583`. 기존 5052 프런트와 기존 백엔드는 보존하고 새 preview 5199(PID 8170)·Spring 18084(PID 7795)로 검증했다. 백엔드 HEAD `d6a3146ffa9d7491acdcabfd5665afc710798f14`, JAR SHA256 `fc9c8c8444f736cb8bed3c7eb1085a1826a0438f9ded060702c47850a76ac812`, local 프로필·격리 `demp-compile-vue-warnings` H2, 허용 origin 5199. 서버 시작 로그 `/tmp/dempfrontend-compile-live-backend.log`, 프런트 로그 `/tmp/dempfrontend-compile-live-preview.log`.

실제 브라우저 회원 로그인 → 초기값 → 질문 추천 → 답변 비추천 → 새로고침 유지 → 질문 비추천 전환 → 같은 버튼 취소 → 새로고침의 7 DOM state assertion 통과. 첫 추천의 role 기반 대기 selector는 변경된 toggle 접근성 표시를 찾지 못했으나 새 DOM에서 실제 저장 완료를 확인하고 이후에는 반응 영역에 범위를 둔 button 속성 selector로 검증했다. assertion을 느슨하게 만들지 않았다. 별도 새 인증/HTTP 조회: 질문 0/0/NONE, 답변 0/1/DISLIKE. served HTML이 최종 dist와 byte 일치. 증거 `/tmp/dempfrontend-compile-live-verification.json`, 화면 `/tmp/dempfrontend-compile-live-verified.png`. 실제 화면을 Playwright fixture 또는 모든 서버 경로 검증이라고 표현하지 않는다.

문서의 로컬 참조 10개와 diff whitespace를 확인했다. 외부 라이브러리 타입 보완/DOM assertion은 필요한 경계에 한정한다. 예상하지 않은 경고 허용 목록, 앱 any, 앱 타입 무시 주석을 추가하지 않았다. 최종 변경의 의미/이름/호출부 리뷰와 실제 검증 후 보호된 PR로 전달한다.
