# 날짜·시간 분리 입력

2026-10-15. 기능별 PR 전달. 브랜치 `refactor/recruitment-date-and-time-entry`, worktree `/Users/seungmin/Desktop/repo/archive/demp/.worktrees/recruitment-date-and-time-entry/frontend`.

기존 통합 작업에서 이 기능의 코드·회귀 테스트만 분리한다. 공통 CI·보호 설정·검증 도구는 변경하지 않는다. 기본 main의 다른 기능은 유지한다. 기존 main 및 통합 작업의 미커밋 내용은 건드리지 않는다.

날짜와 시각은 별도 입력으로 받고 완성된 값만 부모에 전달한다. 날짜 변경은 기존 초를 보존하고 마감 버튼은 명시적으로 23:59:00을 선택한다. 일부 입력은 유지하면서 남은 칸을 required로 안내한다. 기존 JSON/DB 시간 필드는 유지한다.

검증: `npm run verify -- --headed`를 해당 분리 worktree에서 실행한다. 기존 통합 작업에서는 실패 테스트 선행 후 최소 변경·전체 검증과 cmux 실제 Spring/H2 저장·재조회를 수행했다. 이번 전달에서는 분리된 입력을 다시 검증하고 정확한 PR head CI·native auto-merge·merge SHA의 main CI를 순서대로 확인한다.

이름·책임 검토: 기존 publicationStatus·date/time·CompanyImage 이름과 공개 계약을 유지한다. 필터는 운영 조회에 한정하고, Vue는 props/event·입력 상태·API 책임으로 검토한다. 불필요한 인터페이스와 위임 객체는 추가하지 않는다. 운영 배포 실행과 CI/머지는 별도 상태다.
