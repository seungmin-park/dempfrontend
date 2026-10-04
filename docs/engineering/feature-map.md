# 기능 지도

| 기능 | 사용자 경로 | UI 상태 소유자 | 검증 |
|---|---|---|---|
| 질문·답변 반응 | `/questions/-1` → 추천/비추천 → 새로고침 | `useContentReaction` | Vitest/production Playwright + 현재 세션 실제 Spring 브라우저 |

## 질문·답변 반응

`QuestionDetail.vue`/`QuestionAnswer.vue`는 대상과 현재 수치를 `ContentReactionControl`에 건넨다. `ContentReactions.vue`는 버튼과 이벤트만 담당한다. `useContentReaction.ts`가 저장 중 차단·확정된 값·실패 안내·화면 이동 후 지연 응답 폐기를 맡고, `src/api/reactions.ts`가 PUT을 수행한다. 최종 회원별 값과 집계의 소유자는 서버 `ContentReactionService`/DB다.

전제: local Spring/H2 + Vite 개발 서버 + 일반 회원 로그인. 안정적인 selector는 `button[aria-label^="추천"]`, `button[aria-label^="비추천"]`, `aria-pressed`다. 같은 버튼을 다시 눌러 취소하고 새로고침 후 유지되는지 확인한다. 저장 실패에는 오류 안내와 재시도가 필요하다.

`npm run verify -- --headed`는 화면·상태 단위 테스트, 타입·경계·lint·build와 API fixture를 이용한 production 브라우저 흐름을 실행한다. 실제 Spring 저장은 사용자가 지정한 현재 세션의 브라우저에서 별도로 검증한다. 구체적인 시작·종료·근거: `.agents/skills/verify-dempfrontend/SKILL.md`, [CI 운영](ci-and-delivery.md), 백엔드 지도: [DEMP 기능 지도](https://github.com/seungmin-park/demp/blob/main/docs/engineering/feature-map.md).
