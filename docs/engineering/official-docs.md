# 현재 기술 스택과 공식 문서

2026-09-29에 `package.json`, `.tool-versions`, `package-lock.json`과 공식 문서를 대조했다. `official-docs.json`을 버전 검사기가 읽는다. 최신 3.x/5.x 같은 가이드는 패치 버전별 스냅샷이 아니므로 설치된 버전보다 새로운 설명이 있으면 해당 릴리스 기록을 우선한다.

| 프로젝트 버전 | 공식 문서 | 적용 범위 |
|---|---|---|
| Node 24.21.0 | [Node 24 API](https://nodejs.org/docs/latest-v24.x/api/) | 24.x LTS 실행 환경 |
| Vue 3.5.43 | [릴리스](https://github.com/vuejs/core/releases/tag/v3.5.43), [Vue 3 가이드](https://vuejs.org/guide/) | 반응성·컴포넌트·템플릿. 가이드는 최신 3.x |
| Vue Router 5.3.1 | [Router 가이드](https://router.vuejs.org/guide/) | 라우트·가드·URL 상태 |
| Vuex 4.1.0 | [Vuex 문서](https://vuex.vuejs.org/) | 기존 인증 store. 공식 문서는 신규 앱에 Pinia를 권장하지만 현재 코드는 Vuex 4 |
| TypeScript 6.0.3 | [6.0 릴리스 노트](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html) | strict 타입·6.0 기본값 및 중단 기능 |
| Vite 8.3.1 | [Vite 가이드](https://vite.dev/guide/) | dev server·build; 최신 8.x 페이지일 수 있음 |
| Vitest 5.0.2 | [5.0 전환 문서](https://vitest.dev/guide/migration/) | Vite/Node 최소 지원 범위와 테스트 러너 |
| Playwright 1.63.0 | [Playwright Test 가이드](https://playwright.dev/docs/intro) | headed E2E와 CI. 최신 1.x 페이지일 수 있음 |
| Tiptap Vue 3.31.3 | [Vue 3 연동](https://tiptap.dev/docs/editor/getting-started/install/vue3) | 공고 본문 작성기. 공식 예시의 Vue CLI 실행 명령은 이 Vite 프로젝트에 적용하지 않음 |

실제 설치 버전은 `npm ci` 이후 `npm ls --depth=0`, 타입/테스트 결과는 `npm run typecheck`, `npm test`로 확인한다. CI의 `node scripts/check-agent-contracts.mjs`는 버전 기록 불일치를 거절한다. 외부 문서의 내용 갱신을 감지하는 검사는 아니다.
