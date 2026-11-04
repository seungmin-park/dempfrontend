# 질문·답변 입력 한도 안내

2026-11-05. 브랜치 `refactor/question-and-answer-input-limits`, worktree `/Users/seungmin/Desktop/repo/dempfrontend/.worktrees/question-and-answer-input-limits`.

## 배경

백엔드 demp #25(49cfaa3)가 질문·답변 쓰기 요청에 한도를 추가했다. 제목 255자, 질문 본문 HTML 50,000자, 태그 10개·태그당 30자, 답변 본문 HTML 20,000자이고, 넘으면 400을 돌려준다. 프런트는 이 한도를 몰라서 사용자는 작성한 뒤에 일반 저장 실패만 보게 된다.

## 사용자에게 보장할 결과

- 저장 요청 전에 한도 초과나 빈 본문을 알리고, 무엇을 얼마나 줄이면 되는지 안내한다.
- 막힌 경우에도 제목·본문·태그 입력은 그대로 남아 같은 화면에서 고칠 수 있다.
- 서버로 보내는 값과 검사하는 값은 같은 HTML(`renderMarkdown` 결과)이다. 서식도 한도에 포함된다고 안내한다.

## 변경

- `src/content/writeLimits.ts`: 백엔드 한도 상수와 입력 문제 문구를 반환하는 순수 함수(`questionInputProblem`, `answerInputProblem`, `hashtagProblem`).
- `QuestionWrite.vue`: 저장 전 검사, 문제가 있으면 role=alert 오류를 표시하고 요청을 보내지 않음. 태그 안내 문구에 개수·길이 한도 표시.
- `Hashtags.vue`: 11번째 태그나 31자 태그는 추가하지 않고 입력값을 유지한 채 오류를 표시.
- `useQuestionAnswers.ts`: 답변 저장 전 검사, 문제가 있으면 `saveError`로 안내하고 저장 상태로 넘어가지 않음.

## TDD 기록

- Red: `npx vitest run tests/unit/QuestionWrite.spec.js tests/unit/Hashtags.spec.js tests/unit/useQuestionAnswers.spec.js`에서 새 테스트 7건이 assertion 실패했다. 요청이 전송되거나 오류 문구가 없었다.
- Green: 위 변경 후 대상 3개 파일 26건 통과.
- Refactor: 한도와 문구를 컴포넌트에서 `writeLimits.ts`로 모아 백엔드 `QuestionLimits`·`AnswerLimits`와 대응하게 했다. 새 동작은 추가하지 않았다.

## 이름·책임 검토

- `*InputProblem`은 문제가 없으면 빈 문자열을 반환하는 조회 함수이고 상태를 바꾸지 않는다. 컴포넌트는 표시와 이벤트, composable은 저장 흐름 상태를 소유한다.
- 독립 TypeScript 모듈은 상수와 순수 함수뿐이라 추가 인터페이스나 클래스는 만들지 않았다. 공개 API 경로와 payload 필드는 바꾸지 않았다.

## 검증

- 헤드리스 `npm run verify` (CI와 동일).
- 헤드 모드 `npm run verify -- --headed`에서는 `tests/e2e/responsive-layout.spec.js:87`(320/390px 요소 간 y 간격)이 간헐적으로 실패한다. 변경 전 main(de52cd7)을 같은 방식으로 3회 반복하면 6건 실패, 헤드리스는 이 브랜치에서 396건 모두 통과했다. 이번 변경과 무관한 기존 헤드 모드 전용 문제로 기록하고 별도 작업으로 남긴다.
