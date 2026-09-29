# DEMP 프런트 작업 가이드

이 저장소는 백엔드와 별도 Git 저장소다. 현재 `package.json`·`.tool-versions`와 [공식 문서](docs/engineering/official-docs.md)를 먼저 확인한다. 질문·답변 반응의 UI 상태와 API 호출 경계는 [기능 지도](docs/engineering/feature-map.md) 및 [설계](docs/engineering/architecture.md)에 적었다. [검증 스킬](.agents/skills/verify-dempfrontend/SKILL.md)을 사용해 `npm test`, `npm run typecheck`, lint, build, headed E2E와 실제 Spring/H2 화면을 각각 확인한다.

Vue 표현 컴포넌트는 `setReaction`을 직접 호출하지 않고 `useContentReaction`에 상태 전이를 맡긴다. `npm run check:agent-contracts`가 현재 이 경계와 문서/manifest 버전 일치를 검사한다. 기능 변경은 먼저 실행 가능한 실패 테스트를 작성하고, 실제 assertion 실패를 확인한 뒤 최소 변경·전체 검증을 수행한다. 로컬 E2E는 사용자가 호출한 cmux workspace의 보조 pane과 같은 workspace의 브라우저에서 보이게 실행한다. 호출 `CMUX_WORKSPACE_ID`·`CMUX_SURFACE_ID` 및 `cmux identify --json`을 먼저 확인하고 다른 workspace를 사용하지 않는다.
