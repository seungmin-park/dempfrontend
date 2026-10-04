## 문제와 결과

사용자 동작의 이전/이후 결과와 변경 이유를 적습니다.

## 책임과 계약

화면 props/event, 상태 소유자, TS/API 의존성 방향, 이름·공개 계약의 검토를 적습니다. 기존 책임을 유지했다면 이유를 적습니다.

## 검증

- Red: 실제 assertion 실패 명령·원인
- Green/Refactor: 최소 변경·구조 개선의 이유
- `npm run verify`의 실제 결과·source/build identity·증거
- 로컬 headed 화면과 실제 Spring/H2 확인 범위·한계

테스트 누락/skip/실행 불가를 통과로 기록하지 않습니다. 필수 계약 manifest를 바꿨다면 이유를 설명합니다.
