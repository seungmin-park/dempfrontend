# 질문·공고 후속 작업 — 2026-10-08

사용자의 남은 작업 목록과 추가 UI/UX 지적을 순차 반영했다. 현재 후보는 `.worktrees/announcement-catalog-and-discovery/{backend,frontend}`, 양쪽 branch `refactor/announcement-catalog-and-discovery`다. 기준 backend main `7981f365dd086745b76993f08b108d46635a044b`, frontend main `269977d93e7a981210c11b076c82cfc16152cd9a`. 앞선 UI Phase `refactor/admin-form-and-question-list-readability`의 미커밋 patch를 가져왔으며 그 원본 worktree도 보존한다.

**아래 로컬 검증 시점의 구현은 미커밋·운영 미배포였다. 기존 질문 조회수의 운영 반영은 따로 확인했다.** 이후 사용자가 남은 전달·운영 반영 단계를 승인해 signed commit/PR/보호된 merge/CI/CD 및 실제 운영 검증을 진행한다.

## 요청별 결과

| 요청 | 관찰한 문제 | 변경·확인한 결과 |
|---|---|---|
| 관리자 공고 등록·편집 전체 화면 | 긴 grid에 서로 다른 입력이 섞임 | 기본 정보/모집 조건·일정/공고 내용/출처·지원/게시 설정 5그룹과 간격, 실제 등록·수정 commit |
| 모집 날짜·시간 팝업 | OS 기본 팝업과 초 표시 | 앱 달력·월/날짜/키보드/초점, 시·분 유지·미수정 초 보존, 위/아래 및 작은 창 범위 제한 |
| 질문 아티클 구분 | 글·메타·페이지가 한 흐름 | 글 경계/12px 간격·명시적 조회/추천, 페이지 nav/24px 간격, 실제20→2→20 |
| 직무·스택 최신화 | 직무21개·스택6개 | [실제 공고 조사](announcement-market-research.md), 직무31개·기술66개/8분야, enum/URL/VARCHAR/저장·검색 호환 |
| 기술 선택 추가 디자인 | 작은 체크박스가 내부 스크롤에 밀집 | 8개 분야 카드 모두 표시, 44px 선택 영역, 검색·선택 요약에서 즉시 해제, 내부 스크롤 제거·반응형 |
| 질문 조회수 운영 확인 | 배포·운영 검증 기록 부족 | 기존 backend CI/CD 성공 source/JAR와 실제2→3→4·순수/편집4 유지 확인 |
| 공고 조회수 | 저장/증가 경로 없음 | published 공개 상세마다 원자 증가, 순수/목록/관리자/실패 제외, DTO/UI·동시성·수동 SQL |
| 공고 정렬 | 최신순 고정 | 최신 등록/마감 임박/조회 많은 순, URL·필터·첫 페이지·뒤로 가기 보존, 실제 DB 순서와 더보기 일치 |
| 공고 오류 제보 | 기본 검증 말풍선·좁은 구성 | inline 오류·도움말/글자 수·128px 입력·44px 버튼·16px 간격, 빈 값 차단·실제 접수 commit |
| 관리자 처리 입력 | 같은 기본 말풍선·가운데 배치 | 제보별 오류/초점·왼쪽 정렬·분리된 내용/버튼, 실제 처리 commit |

API가 제공하지 않는 질문 작성자/작성일을 만들어 표시하지 않았다. 기존 문자열 `React`, JSON `language`, DB VARCHAR는 보존했다. 조사한 개인 지원 상태·메모는 저장소에 복사하지 않았다.

## 사용자 목적과 실패 후 회복

공통 개발 철학·맥락 유지 기준은 [AGENTS.md](../AGENTS.md)에 기록했다. 추가 절차·검색·오류로 흐름이 끊겨도 사용자가 다시 찾거나 다시 입력하지 않아야 한다. 로그인·회원가입은 사용자가 든 일반 원칙의 예시이며 현재 인증 기능을 새로 개선한 것으로 보고하지 않는다.

```text
공용 기술 항목 → 검색·분야별 표현 → 부모가 소유한 선택 → API → 저장
                    │                      │
                    └─ 숨긴 선택도 요약 해제 └─ 오류 후 보존·수정·재시도

공개 상세 → Service 쓰기 TX → Repository 원자 증가 → DTO → 화면
정렬 선택 → route query → DB ID 정렬/페이지 → 관계 조회·순서 복원
```

기술 선택은 검색 결과가 없어도 선택을 보존한다. 모두 해제한 저장은 HTTP를 보내지 않고 기술 검색으로 초점을 옮겨 바로 옆에 원인과 고칠 위치를 보여 준다. 선택하면 오류가 즉시 사라진다. 저장500에는 검색·선택·제목·본문을 유지하고 같은 화면에서 동일 값으로 재시도한다. 저장 중 선택·중복 제출은 막는다. 제보와 처리 실패도 각 입력/상태 소유자가 내용을 보존한다.

TechnologySelector는 검색·표현·props/event, 부모는 선택/저장/검증 상태, API 모듈은 HTTP를 맡는다. 달력은 표현/선택/배치만 맡으며 부모의 저장 계약을 유지한다. 제보와 관리자 처리는 API 효과가 달라 공통 제출 함수로 억지 통합하지 않았다. Vue는 props/event·상태/API로, TS 모듈은 공개 계약·이름·의존성 방향으로 검토했다.

## 실제 검증과 한계

- UI 초기 Red: 폼/달력4, 질문1, 제보5, 관리자처리3 actual assertion 실패 → 최소 구현 후 검증했다.
- 추가 기술 선택/작은 달력 Red5 → Green29; 기술 누락의 오류 위치 안내 Red1 → Green31. 저장500 후 보존/동일 재시도 테스트는 처음부터 통과한 기존 보장이다. 억지 Red를 만들지 않았다.
- 최종 frontend **53 suites / 320 tests**, typecheck·contracts·lint·build exit0. backend 현재 main 기반 **417 tests / 필수61 suites**와 문서/격리H2 flow 통과. 실제 MySQL **158 checks** 통과.
- caller cmux `workspace:1000020005` / `surface:1000020016`을 env·identify로 확인했다. helper pane `1000020010`의 preview0017/backend0018/browser0019/tests0020를 재사용했다. 실제 current frontend51019/backend18084로 실행했다.
- 실제 등록 초기11 assertions 후 스크립트 JS 문자열 오류가 나 원본 실패를 보존했다. 동일 공고에서 이어 검증18, 질문 페이지3, 제보/처리17, 최종 기술 선택15, 최종 달력8 assertions가 각각 통과했다.
- 320/390/640/768/1024/1440px에서 기술 선택·정렬·두 입력 화면 경계를 확인했다. 500px 높이에서 달력의 경계와 마지막 날짜 키보드 접근도 확인했다. macOS WebKit의 기본 Tab 버튼 건너뛰기는 기록하고 실제 Option+Tab으로 해제 버튼 접근을 확인했다.
- 독립 정적 리뷰에서 작은 창의 달력 P2를 찾아 회귀 검증/공간 제한으로 수정했다. 마지막 재리뷰에 추가 substantive finding은 없었다. 리뷰는 GUI 재실행 결과가 아니다.
- 로컬 Chrome for Testing 제외 지시를 유지했다. CI용 Playwright **206 cases 발견만** 했으며 로컬/CI 실행 통과로 보고하지 않는다.

전체 로그·원시 JSON·스크린샷·실패 이력은 [현재 검증 기록](https://github.com/seungmin-park/demp/blob/main/docs/verification/announcement-catalog-and-discovery/README.md), 백엔드 설계/TDD/이름 검토는 [현재 계획](https://github.com/seungmin-park/demp/blob/main/docs/plans/announcement-catalog-and-discovery.md), 질문의 기존 운영 반영은 [운영 증거](https://github.com/seungmin-park/demp/blob/main/docs/verification/announcement-catalog-and-discovery/production-question-views.md)에 남겼다.

현재 서버/검증 pane은 결과를 볼 수 있게 유지한다. 새 공고 기능의 실제 운영 확인은 배포 이후 필요하며, 후보 JAR 전에 hits 수동 SQL이 적용되어야 한다.
