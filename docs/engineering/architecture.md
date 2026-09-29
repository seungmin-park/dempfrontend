# 반응 UI의 책임 경계

```text
QuestionDetail/Answer → ContentReactionControl → useContentReaction → reactions API → Spring
        props                     화면 상태·응답 경쟁       HTTP          영속 상태
```

`ContentReactions`는 표시·클릭 이벤트만 소유한다. `useContentReaction`은 진행·실패·라우트 전환과 늦은 응답을 정리한다. 서버 응답이 확정된 수치이며 Vuex 인증 store가 로그인 상태를 소유한다. `scripts/check-agent-contracts.mjs`는 화면 컴포넌트가 `setReaction`을 직접 가져오는 지름길을 거절한다. 간접 호출이나 동적 import까지 찾아내는 도구는 아니므로 단위·headed E2E와 실제 Spring 흐름을 함께 확인한다.
