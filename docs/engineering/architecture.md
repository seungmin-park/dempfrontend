# 반응 UI의 책임 경계

```text
QuestionDetail/Answer → ContentReactionControl → useContentReaction → reactions API → Spring
        props                     화면 상태·응답 경쟁       HTTP          영속 상태
```

`ContentReactions`는 표시·클릭 이벤트만 소유한다. `useContentReaction`은 진행·실패·라우트 전환과 늦은 응답을 정리한다. 서버 응답이 확정된 수치이며 Vuex 인증 store가 로그인 상태를 소유한다. `scripts/check-agent-contracts.mjs`는 SFC/TS AST로 다른 반응 API 실행 import, 화면의 직접 transport 접근, composable/API의 화면 역참조를 거절한다. 타입 import는 허용하며 계산된 동적 경로·간접 우회는 코드 리뷰 대상이다. [검증과 전달](ci-and-delivery.md)에 검사 범위·한계와 객체 책임을 기록했다. 단위·production headed E2E와 실제 Spring 흐름을 함께 확인한다.
