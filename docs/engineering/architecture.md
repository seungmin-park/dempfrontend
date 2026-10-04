# 반응 UI의 책임 경계

```text
QuestionDetail/Answer → ContentReactionControl → useContentReaction → reactions API → Spring
        props                     화면 상태·응답 경쟁       HTTP          영속 상태
```

`ContentReactions`는 표시·클릭 이벤트만 소유한다. 클릭 계약 `ReactionChoice`는 `RECOMMEND`/`DISLIKE`이며 현재 선택과 비교해 `NONE` 취소를 결정하는 객체는 `useContentReaction`이다. 깊은 읽기 전용 state/saving/error를 반환하므로 호출자가 서버 확정값을 덮어쓰는 코드는 컴파일이 거절한다. 서버 응답의 `ReactionType`은 여전히 `NONE`을 포함하며 HTTP 계약은 유지한다. `useContentReaction`은 진행·실패·라우트 전환과 늦은 응답을 정리한다. 서버 응답이 확정된 수치이며 Vuex 인증 store가 로그인 상태를 소유한다. `scripts/check-agent-contracts.mjs`는 SFC/TS AST로 다른 반응 API 실행 import, 화면의 직접 transport 접근, composable/API의 화면 역참조를 거절한다. 타입 import는 허용하며 계산된 동적 경로·간접 우회는 코드 리뷰 대상이다. [검증과 전달](ci-and-delivery.md)에 검사 범위·한계와 객체 책임을 기록했다. 단위·개발/배포 headed E2E와 실제 Spring 흐름을 함께 확인한다.

`validationComponents.ts`는 VeeValidate의 기존 컴포넌트에 타입이 있는 네이티브 HTML 속성을 보완하는 외부 라이브러리 경계다. runtime wrapper·추가 상태·새 검증 규칙을 만들지 않는다. 원래 props/event 타입을 유지하며 잘못된 속성 이름과 필드 이름 타입도 검사한다. 이를 모든 Vue 컴포넌트의 무제한 속성 허용으로 확대하지 않는다.
