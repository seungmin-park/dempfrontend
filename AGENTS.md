# DEMP 프런트 작업 가이드

이 저장소는 백엔드와 별도 Git 저장소다. 현재 `package.json`·`.tool-versions`와 [공식 문서](docs/engineering/official-docs.md)를 먼저 확인한다. 질문·답변 반응의 UI 상태와 API 호출 경계는 [기능 지도](docs/engineering/feature-map.md) 및 [설계](docs/engineering/architecture.md)에 적었다. [검증 스킬](.agents/skills/verify-dempfrontend/SKILL.md)을 사용해 `npm test`, `npm run typecheck`, lint, build, headed E2E와 실제 Spring/H2 화면을 각각 확인한다.

Vue 표현 컴포넌트는 `setReaction`을 직접 호출하지 않고 `useContentReaction`에 상태 전이를 맡긴다. `npm run check:agent-contracts`는 SFC/TS AST로 이 경계, 직접 HTTP 접근·역참조, 문서/manifest 버전 일치를 검사한다. Vue는 props/event·렌더링·상태/API 경계로, TS 모듈은 공개 계약·책임·의존성 방향으로 검토한다. 변경 코드의 이름과 호출부·직렬화·라우트 계약도 확인한다.

기능 변경은 먼저 실행 가능한 실패 테스트를 작성하고, 실제 assertion 실패를 확인한 뒤 최소 변경·전체 검증을 수행한다. 표준 전체 검증은 `npm run verify -- --headed`, CI는 `npm run verify`다. 필수 테스트 누락·skip·실패, 빌드 파일 누락, 실행 중 소스 변경은 완료가 아니다. 로그/결과는 `.verification/`, 보호된 PR 전달은 [CI 운영](docs/engineering/ci-and-delivery.md)을 따른다. 일반 구현 요청으로 commit·자동 머지 권한을 확대하지 않는다.

로컬 E2E는 사용자가 지정한 현재 세션에서 러너와 실제 브라우저를 보이게 실행한다. 사용자가 현재 Codex 세션을 지정하면 그 지시를 우선한다. cmux를 지정했다면 호출 `CMUX_WORKSPACE_ID`·`CMUX_SURFACE_ID` 및 `cmux identify --json`으로 대상 workspace를 확인하고 보조 pane/브라우저를 재사용한다. 다른 작업의 서버·pane·미커밋 변경을 건드리지 않는다. API fixture 화면 검증과 실제 Spring/H2 영속성 검증을 구분한다.
