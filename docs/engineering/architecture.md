# 반응 UI의 책임 경계

## 질문·태그·관리자 표시

```text
QuestionDetail ── 본인 편집 링크 ──► QuestionWrite ──► questions API ──► QuestionService/DB
                                    입력·응답 경쟁      HTTP           작성자 검사·저장
route query ──► QuestionTagFilters / QuestionControl / QuestionList
                 표시·해제             checkbox            조회
Login store ──► useAdminAccess ──► admin API ──► 서버 /api/admin/me
                     │ readonly 판정
                     └──► App footer
```

질문 편집은 기존 작성 컴포넌트를 재사용한다. `QuestionWrite`가 입력 복원·Markdown 변환·저장 중 차단·지연 응답 폐기를 조정하며 `questions.ts`만 HTTP PATCH를 실행한다. 편집 요청은 작성자 이름을 바꾸지 않는다. 화면의 본인 비교는 안내용이며 서버의 작성자 검사가 최종 권한이다. 태그 입력은 `initialTags`와 `disabled`를 받아 기존 `addHashtags` 이벤트로 전달한다. 필터는 URL을 원본으로 삼아 표시·checkbox·조회가 같은 조건을 읽는다.

`useAdminAccess`는 서버 권한 확인 중과 실패 시 false이며, 토큰/사용자 변경 시 판정을 비운다. 요청 세대를 비교해 로그아웃·계정 전환·unmount 뒤의 응답을 버린다. `App`은 읽기 전용 판정만 소비한다. 관리자 route guard와 서버 권한 검사는 각각의 진입·API 접근을 계속 보호한다.

공통 client는 현재 로그인과 같은 토큰으로 보낸 요청의 Axios 401에만 인증 만료를 알린다. 계정 교체/로그아웃 전에 보낸 요청의 늦은 401은 새 인증 상태를 비우지 않으며 요청 자체의 실패는 호출부에 전달한다. 서식 converter는 기존 u/table뿐 아니라 del도 HTML로 보존해 관련 없는 제목/태그 수정으로 취소선 의미를 잃지 않게 한다.

## 공고 입력과 공통 표시

```text
AdminAnnouncementEditor → announcements API → 서버 Announcement/DB
  고용 형태·날짜·checkbox 입력                 EMP/EDU 상태 규칙
서버 상세·목록·스크롤 → AnnouncementAudience → 경력/고용 형태 배지
서버 이력 배열 → editor의 이력 목록 → 날짜·작성자·상태 / 제목
```

고용 형태는 모집 대상과 별개이고 기존 null은 미확인이다. HTTP serializer는 EMP에만 값을 전달하며 서버도 EDU 값을 비운다. 공통 표현 컴포넌트가 목록/상세/관련 공고의 문구를 통일한다. 분 단위 날짜의 표시 값과 수정하지 않은 서버 정밀도는 editor가 조정한다. 기술 스택은 기존 native label/input과 저장 배열을 유지하고, 이력은 서버 순서/값을 표시만 하므로 새로운 상태 객체를 추가하지 않는다. CSS gap·padding·줄바꿈은 각각 해당 입력/목록 영역이 소유하며 공백 문자열이나 전역 span 규칙으로 정렬하지 않는다.

답변 페이지의 협력은 아래와 같다. 목록·커서의 변경 이유와 HTTP의 변경 이유를 분리하되 단순 위임 객체는 추가하지 않는다.

```text
QuestionDetail view → QuestionAnswer → useQuestionAnswers → answers API → AnswerService/DB
 route·인증 props       렌더링·이벤트       목록·입력·응답 경쟁      HTTP           영속 상태
```

`useQuestionAnswers`는 읽기 전용 상태와 입력/조회/저장 명령을 노출한다. 현재 목록을 기준으로 단건 prepend·페이지 append를 수행하고 이미 있는 ID를 우선한다. 실제 반응 확정 상태는 기존 keyed `ContentReactionControl`/`useContentReaction`에 남는다. props의 질문이 바뀌거나 unmount되면 요청 세대를 무효화한다. `getAnswers`의 before는 문자열이며 페이지 경계를 바이트 손실 없이 서버에 전달한다.

```text
QuestionDetail/Answer → ContentReactionControl → useContentReaction → reactions API → Spring
        props                     화면 상태·응답 경쟁       HTTP          영속 상태
```

`ContentReactions`는 표시·클릭 이벤트만 소유한다. 클릭 계약 `ReactionChoice`는 `RECOMMEND`/`DISLIKE`이며 현재 선택과 비교해 `NONE` 취소를 결정하는 객체는 `useContentReaction`이다. 깊은 읽기 전용 state/saving/error를 반환하므로 호출자가 서버 확정값을 덮어쓰는 코드는 컴파일이 거절한다. 서버 응답의 `ReactionType`은 여전히 `NONE`을 포함하며 HTTP 계약은 유지한다. `useContentReaction`은 진행·실패·라우트 전환과 늦은 응답을 정리한다. 서버 응답이 확정된 수치이며 Vuex 인증 store가 로그인 상태를 소유한다. `scripts/check-agent-contracts.mjs`는 SFC/TS AST로 다른 반응 API 실행 import, 화면의 직접 transport 접근, composable/API의 화면 역참조를 거절한다. 타입 import는 허용하며 계산된 동적 경로·간접 우회는 코드 리뷰 대상이다. [검증과 전달](ci-and-delivery.md)에 검사 범위·한계와 객체 책임을 기록했다. 단위·개발/배포 headed E2E와 실제 Spring 흐름을 함께 확인한다.

`validationComponents.ts`는 VeeValidate의 기존 컴포넌트에 타입이 있는 네이티브 HTML 속성을 보완하는 외부 라이브러리 경계다. runtime wrapper·추가 상태·새 검증 규칙을 만들지 않는다. 원래 props/event 타입을 유지하며 잘못된 속성 이름과 필드 이름 타입도 검사한다. 이를 모든 Vue 컴포넌트의 무제한 속성 허용으로 확대하지 않는다.
