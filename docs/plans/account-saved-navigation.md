# 마이페이지의 관심 공고와 인증 복귀

- Phase: 계정 탐색 및 인증 진입 정리
- 브랜치: `refactor/account-saved-navigation`
- worktree: `/Users/seungmin/Desktop/repo/archive/demp/.worktrees/account-saved-navigation/frontend`

## 사용자 결과

비회원이 공고·질문·질문 작성을 누르면 기본 alert 대신 기존 인증 라우터가 로그인으로 보내고, 성공 후 원래 대상에 돌아온다. 공고 검색 조건도 상세 이동 주소에 남긴다. 관심 공고 저장 버튼은 이미 선택 ID와 검색 조건을 보존하므로 이 경로를 유지한다.

회원은 상단의 마이페이지 하나에서 `관심 공고`와 `계정 설정`을 찾는다. 이전 `/saved` 링크는 `/mypage?tab=saved`로 연결하고, 저장 목록·해제·오류 재시도는 기존 상태 소유자인 `useSavedAnnouncements`가 담당한다. 계정의 닉네임·비밀번호 상태는 `useMemberAccount`가 유지한다.

```text
목록 클릭 → 대상 보호 경로 → 인증 가드 → 로그인 → 원래 대상
마이페이지 → 관심 공고 | 계정 설정
                       ↓             ↓
             useSavedAnnouncements  useMemberAccount
```

## 화면 판단 근거

- [Indeed Saved Jobs](https://www.indeed.com/help/job-seekers/articles/14087165677837-my-jobs-saving-a-job)는 저장한 공고를 `My Jobs`의 `Saved`에서 관리한다.
- [LinkedIn Saved Jobs](https://www.linkedin.com/help/linkedin/answer/a513247/managing-jobs-you-saved-on-linkedin?lang=en)는 작업 추적 공간의 저장 목록에서 공고 재방문과 해제를 제공한다.
- [Baymard 계정 탐색 연구](https://baymard.com/research-articles/account-drop-down-structure)는 자주 쓰는 계정 경로를 구별하고 사이트 맥락에 맞춰 우선순위를 정하도록 권한다. DEMP에는 현재 두 섹션만 있어 명확한 글자 내비게이션으로 충분하다.

기존 DEMP의 보라색과 Pretendard를 유지한다. 페이지 제목을 먼저 보여주고 그 아래에 48px 높이의 섹션 내비게이션을 놓는다. 저장 목록과 계정 폼은 같은 콘텐츠 시작선에 둔다. 320px에서도 링크가 줄바꿈되고 가로 넘침이 없어야 한다.

## 검증 기준

1. 비회원 공고·질문·질문 작성 클릭에 브라우저 alert가 없고 로그인 복귀 URL이 대상과 검색 조건을 보존한다.
2. 마이페이지에서 관심 공고·계정 설정 이동, 새로고침, 저장 공고 해제와 재조회가 된다.
3. `/saved` 직접 주소도 새 마이페이지 관심 공고로 연결되며 보호 경로 인증은 유지된다.
4. 프런트 표준 `npm run verify -- --headed`와 현재 cmux workspace의 실제 클릭·화면 검증을 통과한다.

## 진행 근거

- Red: 비회원 공고/질문/작성 이동, 마이페이지 섹션, `/saved` 연결의 5개 테스트가 의도한 assertion으로 실패했다.
- Green: 라우터가 인증 이동을 소유하도록 공개 목록의 alert 분기를 제거하고, 저장 목록을 마이페이지 섹션에 배치했다.
- 전체 단위 테스트 371개, 타입 검사, lint는 통과했다. 첫 표준 검증은 기존 `VerificationSource.spec.js`의 임시 Git 실행 2건이 전체 병렬 부하에서 5초를 넘겨 단위 단계에서 멈췄으며, 해당 파일 단독 18건은 통과했다. 최종 전체·브라우저 검증 결과는 후속 실행으로 확인한다.
