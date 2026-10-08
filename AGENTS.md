# DEMP 프런트 작업 가이드

## 사용자 중심 개발 철학

“개발자가 조금 더 고생하더라도, 사용자가 한 번이라도 덜 클릭하고 더 편리하게 사용할 수 있도록 만들어야 한다.”

설계와 리뷰에서는 사용자가 원하는 결과에 도달하는 클릭·재입력·화면 이동을 줄이는 것을 우선한다. 검색·오류·재시도 중에도 입력과 선택을 보존하고, 필요한 정보와 다음 행동을 한눈에 알 수 있게 만든다. 편의성을 위해 데이터 정확성·접근성·권한 검증을 약화하지 않는다.

TDD는 절차 수행이 아니라 구현 전에 사용자에게 보장할 결과와 실패 시 지켜야 할 상태를 정의하는 수단이다. 성공뿐 아니라 실제 사용자 경로의 오류·경계값·중복 실행·재시도를 검토한다. 실패해도 입력과 선택을 보존하고 원인·고칠 위치·다음 행동을 안내하며 같은 화면에서 회복할 수 있는지 검증한다. 이미 보장되는 동작의 테스트가 처음부터 통과하면 기존 보장 확인으로 기록하고, 억지 실패를 만들어 Red라고 보고하지 않는다. 테스트 통과를 미검증 조건까지 포함한 기능 보장으로 표현하지 않는다.

시스템은 사용자의 목적과 맥락을 끝까지 책임진다. 인증·권한 확인·추가 입력·외부 절차·오류 처리로 흐름이 끊기면 원래 위치·검색 조건·선택·작성 내용을 유지하고, 절차 완료 후 원래 작업을 자연스럽게 이어가게 한다. 사용자가 다시 찾거나 다시 입력해야 하는지, 중간 절차를 취소하거나 실패해도 회복할 수 있는지를 설계와 검증에서 확인한다. 로그인·회원가입 복귀는 이 원칙의 한 예시이며 모든 사용자 흐름에 적용한다.

이 저장소는 백엔드와 별도 Git 저장소다. 현재 `package.json`·`.tool-versions`와 [공식 문서](docs/engineering/official-docs.md)를 먼저 확인한다. 질문·답변 반응의 UI 상태와 API 호출 경계는 [기능 지도](docs/engineering/feature-map.md) 및 [설계](docs/engineering/architecture.md)에 적었다. [검증 스킬](.agents/skills/verify-dempfrontend/SKILL.md)을 사용해 `npm test`, `npm run typecheck`, lint, build, headed E2E와 실제 Spring/H2 화면을 각각 확인한다.

Vue 표현 컴포넌트는 `setReaction`을 직접 호출하지 않고 `useContentReaction`에 상태 전이를 맡긴다. `npm run check:agent-contracts`는 SFC/TS AST로 이 경계, 직접 HTTP 접근·역참조, 문서/manifest 버전 일치를 검사한다. Vue는 props/event·렌더링·상태/API 경계로, TS 모듈은 공개 계약·책임·의존성 방향으로 검토한다. 변경 코드의 이름과 호출부·직렬화·라우트 계약도 확인한다.

`typecheck`는 strict TS·Vue 템플릿과 인덱스 누락·선택 속성·반환 경로를 검사한다. `build`도 먼저 같은 타입 검사를 실행한다. 앱 TS/Vue에서 명시적 any·ts-ignore·ts-nocheck·ts-expect-error로 오류를 숨기지 않는다. lint가 이를 거절하며 부정 컴파일 사례의 ts-expect-error는 tests/types에만 둔다. 반응 상태는 읽기 전용이며 사용자 선택은 `RECOMMEND`/`DISLIKE`, 취소 `NONE` 결정은 상태 소유자가 맡는다. 단위 테스트와 개발/배포 Playwright에서 예상하지 않은 `[Vue warn]`은 실패다. 경고를 숨기거나 일반 allowlist를 추가하지 말고 실제 prop·등록·데이터·테스트 경계를 고친다. 의도적인 경고 검증만 해당 테스트의 별도 수집기로 확인한다.

기능 변경은 먼저 실행 가능한 실패 테스트를 작성하고, 실제 assertion 실패를 확인한 뒤 최소 변경·전체 검증을 수행한다. 표준 전체 검증은 `npm run verify -- --headed`, CI는 `npm run verify`다. 필수 테스트 누락·skip·실패, 빌드 파일 누락, 실행 중 소스 변경은 완료가 아니다. 로그/결과는 `.verification/`, 보호된 PR 전달은 [CI 운영](docs/engineering/ci-and-delivery.md)을 따른다. 일반 구현 요청으로 commit·자동 머지 권한을 확대하지 않는다.

로컬 E2E는 사용자가 지정한 현재 세션에서 러너와 실제 브라우저를 보이게 실행한다. 사용자가 현재 Codex 세션을 지정하면 그 지시를 우선한다. cmux를 지정했다면 호출 `CMUX_WORKSPACE_ID`·`CMUX_SURFACE_ID` 및 `cmux identify --json`으로 대상 workspace를 확인하고 보조 pane/브라우저를 재사용한다. 다른 작업의 서버·pane·미커밋 변경을 건드리지 않는다. API fixture 화면 검증과 실제 Spring/H2 영속성 검증을 구분한다.
