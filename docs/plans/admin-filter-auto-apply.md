# 운영 공고 필터 즉시 적용

2026-10-15. Phase: 운영 목록 선택 즉시 조회.
브랜치: `refactor/admin-filter-auto-apply`.
worktree: `/Users/seungmin/Desktop/repo/archive/demp/.worktrees/admin-filter-auto-apply/frontend`.
기준 main: `541a0a9afd69a3730716315d827213cee7f99495`. 사용자 승인에 따라 이 기능 단위로 commit·PR·CI·native auto-merge를 진행한다.

## 요구와 원인

공고 종류·게시 상태를 선택하면 검색 클릭 없이 조회하고 목록을 갱신한다.
기존 선택 상자는 v-model만 연결되어 URL을 바꾸지 않았다.

```text
선택 change → search → navigate(첫 페이지) → URL query
  → load → 기존 관리자 API → 마지막 요청의 목록 표시
```

## 변경과 책임 리뷰

AdminCollection의 두 select에 `@change="search"`를 연결했다.
search는 조건 적용, navigate는 URL 이동, load는 조회와 응답 세대 보호를 맡는다.
기존 이름과 책임이 실제 효과와 일치하므로 새 객체·위임 계층을 추가하지 않았다.
API 모듈과 백엔드 계약·직렬화·경로 변경은 없다.
Vue는 렌더링·이벤트·상태/API 경계로 검토했고 독립 TS 모듈 변경은 없다.
첫 페이지 복귀와 현재 검색어·다른 필터 전달을 기존 흐름에서 재사용한다.
별도 Refactor는 불필요하여 하지 않았다.

## 실제 검증

- Red: `npm test -- tests/unit/AdminOperations.spec.js`에서 선택만 바꾸면 router.push 호출 0회로 1개 assertion 실패.
- Red: `npm test -- tests/unit/AdminFilterAutoApply.spec.js`에서 종류·페이지 URL 불변과 마지막 목록 미갱신으로 2개 assertion 실패.
- 테스트 준비 과정의 경로 오류·캐시 쓰기 권한 오류·라우터 경고와 hook timeout은 기능 Red가 아니다. 경로/권한 및 테스트 라우트·hook 반환을 수정한 후 위 assertion 실패를 다시 확인했다.
- Green: 두 change 연결 후 대상 33개 통과.
- 전체: `npm run verify -- --headed` exit 0. 구조 검사·부정 probe·타입·lint·build, 단위 341개와 개발/배포 브라우저 228개 통과. skip/retry로 대체하지 않음.
- E2E의 상태 선택→목록·새로고침·전체 해제 흐름에서 검색 클릭을 제거했다.
- 실제 라우터 단위 검증에서 종류 선택 첫 페이지 조회, 검색어·게시 상태 유지, 늦은 이전 응답이 최신 목록을 덮지 않음을 확인했다.
- workspace `workspace:1000090001`, 보조 terminal `surface:1000090015`에서 headed 러너 실행. 호출 workspace와 다른 시각적 포커스를 구분했다.
- 로그: `/private/tmp/demp-admin-filter-verify.log`, `.verification/summary.json`, `.verification/unit.json`, `.verification/e2e.json`.
- 브라우저 검증은 Playwright API fixtures이며 실제 DB·운영 배포 증거가 아니다. cmux WebKit의 mock 기능으로 대체하지 않았다.
- 실행 종료 뒤 사용자가 headless를 지정했다. 이후 실행은 headless로 하며 완료한 검증을 불필요하게 반복하지 않았다.

초기 구현 완료 시점에는 미커밋이었다. 이후 사용자가 기능 단위 PR·CI·자동 머지를 승인했다. main 보호와 필수 GitHub Actions 검사, 최신 base, 대화 해결 조건을 조회하고 정확한 head SHA에 squash auto-merge를 신청한다. 실제 PR/merge SHA와 main CI 결과는 전달 기록에 남긴다. 운영 배포는 이 작업의 검증 범위에 포함하지 않는다.
