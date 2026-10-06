# 로그인 제한 화면

2026-10-06 승인한 계정별 5회 실패·15분 제한을 표시한다. `refactor/shared-login-attempt-protection`, `.worktrees/shared-login-attempt-protection/frontend`에서 미커밋으로 진행한다. 이전 CI 무결성 변경도 이어 둔 상태다.

```text
서버 Member DB 상태 → 429 + Retry-After → members API.getLoginRateLimit
                                                ↓
                         LoginForm: 입력 보존·남은 대기 시간 안내
```

API 모듈이 status/header를 해석하고 Vue는 한국어 안내·입력·이동을 맡는다. 제한 상태의 소유자는 서버이며 클라이언트 시계로 제한을 우회하거나 연장하지 않는다. Retry-After는 응답 시점의 남은 시간이며 화면에서 별도 카운트다운하지 않는다. 다른 계정 입력과 재시도가 가능하고 재시도 결과는 다시 서버가 판단한다. 잘못되거나 없는 헤더는 추측 시간 대신 잠시 후 안내를 사용한다. 성공 응답/인증 store/redirect는 유지한다. TS 모듈의 공개 함수 이름과 책임 및 Vue의 표현/API 경계를 검토했다.

단위 Red는 기존 일반 로그인 오류가 2분 5초 안내를 하지 못한 assertion이다. 현재 cmux workspace:3 surface:11에서 headed 개발·배포 fixture E2E도 실제 같은 assertion으로 실패했다. Green은 API 오류 해석과 표시 분기만 추가한다. 전체 자동 검사 결과는 `.verification/summary.json`, 실제 Spring/H2 화면 결과는 backend 작업 기록을 따른다. fixture 브라우저는 서버 저장을 입증하지 않으므로 실제 서버 화면을 별도로 확인한다.
