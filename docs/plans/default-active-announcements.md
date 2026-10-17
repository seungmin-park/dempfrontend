# 기본 공고 목록의 마감 제외

- Phase: 공개 공고 검색 기본값
- Branch: `refactor/default-active-announcement-filter`
- Worktree: `/Users/seungmin/Desktop/repo/archive/demp/.worktrees/default-active-announcements/frontend`
- Backend dependency: `seungmin-park/demp#22` (`recruitmentStatus=ACTIVE`)

## 사용자 경로

처음 목록 방문이나 기존 필터 URL에 상태가 없으면 `모집 중·예정`을 기본으로 선택하고 서버에 `ACTIVE`를 보낸다. 사용자가 `전체`를 고르면 `status=ALL`을 URL에 기록하고 서버 상태 조건은 보내지 않는다. 직접 선택한 모집 중·예정·마감은 기존처럼 복원한다. 초기화는 기본 상태로 돌아간다.

```text
URL 상태 없음 → 기본 ACTIVE → API ACTIVE → 마감 제외 목록
URL status=ALL → 전체 선택 → API 상태 없음 → 전체 목록
URL status=CLOSED → 마감 선택 → API CLOSED → 마감 목록
```

## 검증

- Red: 기본 URL의 API 요청·필터 표시, 전체 선택의 URL/API/새로고침, 명시적 마감 선택과 초기화 실패를 확인한다.
- Green: URL 직렬화와 선택지, API 전달을 변경한다.
- Refactor: 헤더의 기본 필터 chip과 해제 동작을 일치시키고 전체 unit/lint/build 및 현재 cmux의 headed E2E를 실행한다.

## 실행 기록

- Red: `AnnouncementFilters.spec.js`에서 기본 상태 표시가 기대한 `모집 중·예정` 대신 `전체`여서 실패했다.
- Green: URL 파서는 상태 미지정을 `ACTIVE`, 명시적 `ALL`을 전체로 해석한다. 직렬화는 기본 상태를 URL에서 생략하고 전체 선택만 `status=ALL`로 기록한다. API 모듈은 기존 계약대로 선택된 상태만 전달한다.
- Refactor: 모집 상태 chip은 명시적으로 선택한 중·예정·마감에만 나타나며, 개별 해제와 전체 초기화는 기본 `ACTIVE`로 돌아간다.
- 대상 unit 14개 통과. cmux headed 브라우저 테스트는 첫 실행에서 `전체` 라디오가 공고 종류와 모집 상태에 둘 다 있어 선택자 오류 2개가 났다. 모집 상태 그룹으로 범위를 좁힌 후 16개 통과했다.
- 첫 전체 검증은 기존 빈 결과 테스트 6개가 실패했다. 기본 `ACTIVE` 조건을 실제 필터로 인식하면서 설명 문구가 일반 조건 결과로 바뀐 것이 원인이다. 빈 기본 결과에는 모집 중·예정 공고가 없다고 명확히 말하고 `마감 포함 전체 보기`를 제공한다. 관련 unit 46개 통과했다.
- 최종 `asdf exec npm run verify -- --headed`: 단위 373개, 브라우저 248개 통과. 타입 검사·lint·build 통과. 현재 cmux 보조 pane에서 실행했고 production/development 양쪽 브라우저가 포함됐다.
- 실제 Spring/H2 `demp#22` 빌드에 격리된 모집 중·예정·마감 3건을 준비했다. API `ACTIVE` 2건, `CLOSED` 1건, 상태 미지정 3건. 같은 작업공간의 cmux 브라우저 390px에서 기본 2건 → `status=ALL` 3건 → `status=CLOSED` 1건 → 뒤로 가기 3건·2건을 확인했다. 가로 넘침 없음. 기본/전체 화면: `/private/tmp/demp-active-default.png`, `/private/tmp/demp-active-all.png`.

이름·책임: `filtersFromQuery`와 `filtersToQuery`가 URL 상태 의미를 소유하고, `AnnouncementHeader`는 선택지와 상태 표시를, API 모듈은 서버 파라미터 전달만 담당한다. 공개 URL의 `status=ALL`이 추가되지만 기존 `OPEN`·`UPCOMING`·`CLOSED`는 그대로 유지한다.
