# 계정 설정 단일 카드

- Phase: 계정 설정 레이아웃 통합
- 브랜치: `refactor/account-settings-single-column`
- worktree: `/Users/seungmin/Desktop/repo/archive/demp/.worktrees/account-settings-single-column/frontend`
- 요구: 회원 정보와 비밀번호 변경을 하나의 카드에서 위에서 아래로 읽고 조작한다.
- 관찰: `MyPage.vue`의 2열 그리드와 두 `account-panel`이 화면을 분할했다.
- Red: `MyPage.spec.js`의 카드 개수 assertion이 2개로 실패했다.
- Green: 두 폼을 한 `account-panel`에 배치하고 비밀번호 영역을 구분선 아래에 놓았다.
- 책임: View는 배치, `useMemberAccount`는 입력 상태와 저장 흐름을 소유한다. API 계약은 유지한다.
- 검증: 대상 단위 테스트, 전체 `npm run verify`의 실제 결과와 PR CI를 확인한다.
