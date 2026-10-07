# DEMP 공고 필터 조사 기록

2026-10-07. 사용자 요청: 직무·기술 스택·모집 상태·내 경력 필터를 유사 서비스/프로젝트의 실제 공개 화면과 비교해 개선한다. 기존 질문/태그/계정 Phase의 backend PR #7과 frontend PR #9은 머지·main CI 확인까지 완료한 뒤 이 조사를 시작했다. 카드 밀도 개선과 조회수 수정은 이후 순서다. 19:25 사용자 첨부의 관리자 공고 등록 화면도 이후 개선 대상으로 추가했다. 새 요청으로 현재 필터 작업이나 기존 대기 작업을 중단하지 않는다.

이 파일은 설계 승인 전 조사 시점의 관찰/제안 기록이다. 사용자가 짧은 설계를 승인했고 Phase/branch `announcement-filter-interactions` / `refactor/announcement-filter-interactions`, frontend worktree `/Users/seungmin/Desktop/repo/archive/demp/.worktrees/announcement-filter-interactions/frontend`에서 순차 TDD를 진행한다. 현재 코드·실행 결과·전달 상태는 [실행 기록](announcement-filter-interactions.md)을 기준으로 확인한다.

## 현재 코드와 실제 화면

읽은 frontend base는 최종 전달 head `9e2e99b`이며 merged main `45b3063`과 같은 tree `b815cd2`다. `src/components/announcement/AnnouncementHeader.vue`, `src/router/announcementFilters.ts`, `src/assets/styles/main.css`, `tests/unit/AnnouncementFilters.spec.js` 및 대응 backend `AnnouncementSearchCondition`, `AnnouncementQueryRepository`를 확인했다. 실제 화면은 기존 cmux workspace `workspace:1000000002` browser `surface:1000000009`, Vite 51017 / Spring 18081 / 격리 H2다.

- 직무 옵션 21개, 기술 옵션 6개, 경력 native select 16개(전체+1~15년).
- desktop `.position-options` 폭은 420px, 기술 popover의 최소 폭은 210px이며 두 `<details>`의 열림을 조정하는 상태 소유자가 없다.
- 실제 두 summary 클릭 후 open panel 2개. 직무 x=171.5~591.5, 기술 x=442.75~652.75, 같은 y=437.078px에서 시작하므로 가로 교집합은 148.75px. 사용자 첨부와 같은 덮임을 관찰했다.
- URL은 목록의 실제 조회 원본이지만 Header의 title은 입력 중인 draft와 적용된 조건을 함께 소유한다. 다른 필터의 `commit()`도 title을 포함하고 chip도 draft title을 즉시 표시한다. 정적 분석 결과이며 검색어 혼입의 실제 회귀는 구현 전 Red로 확인해야 한다.
- 서버 `career=0`은 무필터다. `career=N>0`은 min≤N, max≥N 또는 max=0을 검사하고 명시적 신입 공고를 제외한다. 화면의 0을 신입 검색으로 바꾸면 실제 계약과 어긋난다.
- positions와 languages는 각 그룹 내부 OR이며 서로 다른 조건 그룹은 AND다. “기술 스택을 모두 포함”으로 표시하지 않는다.
- EDU는 경력을 제거하고 교육비·수업 방식·시간·지역·지원 조건·기간·개강일을 조회한다. 이 경계를 유지한다.

## 비교 근거

| 대상/출처 | 확인한 사실 | DEMP에 가져올 판단 | 확인 한계 |
|---|---|---|---|
| [점핏 개발 직무 탐색](https://jumpit.saramin.co.kr/positions) | 공개 목록과 cmux 렌더링에서 직무 선택과 기술스택·경력·지역·태그 버튼이 구분됨 | 조건 이름과 선택 상태를 분명히 구분 | 버튼 클릭/키보드 후 세부 패널을 확인하지 못함. 검색창/적용 방식/단일 패널 정책을 점핏의 실제 동작이라고 주장하지 않음 |
| [원티드 개발 채용](https://www.wanted.co.kr/wdlist/518) | cmux에서 직군/직무·경력 전체·태그 전체·지역·채용조건·기술스택의 버튼과 공고를 확인 | 경력·직무·기술의 별도 의미와 선택 요약 | web fetch 403; cmux 공개 화면은 로딩됨. 세부 경력 패널을 확인하지 못했으므로 range slider 등은 근거에 넣지 않음 |
| [원티드 공식 공고 작성 가이드](https://help.wanted.co.kr/hc/ko/articles/20790816666393-%EA%B3%B5%EA%B3%A0-%EC%9E%91%EC%84%B1-%EA%B0%80%EC%9D%B4%EB%93%9C%EA%B0%80-%EA%B6%81%EA%B8%88%ED%95%B4%EC%9A%94) | 입력한 경력 값이 구직자의 경력 필터에 따른 노출에 영향을 주며 공고 내용과 일치해야 한다고 안내 | 보기 좋은 이름이 서버 의미를 바꾸지 않게 함 | 원티드 정책을 DEMP 정책으로 복사하지 않음 |
| [로켓펀치 채용](https://www.rocketpunch.com/jobs) | 공개 페이지에 키워드·직군·숙련도·기업 규모·근무 방식의 독립 조건과 키워드 설명이 있음 | 조건별 검색 의미를 짧게 설명 | 로그인 제한이 있고 세부 선택/모바일 동작은 확인하지 않음. 사용자/기업 데이터는 수집하지 않음 |
| [Reka UI 공개 프로젝트 Combobox](https://reka-ui.com/docs/components/combobox) | 다중 값·검색 필터·명시적 label·키보드 조작을 공개 계약으로 설명 | 검색/선택/접근성의 계약을 테스트할 참고 자료 | 새 라이브러리 도입이나 전체 combobox 구현을 제안하지 않음. DEMP는 native checkbox/radio+disclosure 사용 |
| [W3C disclosure 패턴](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) | button의 Enter/Space와 aria-expanded, 필요 시 aria-controls를 설명 | 실제 열림 상태와 접근성 상태를 연결 | 바깥 클릭/Esc/포커스 복귀는 DEMP 제안 동작으로 별도 검증 |
| [프로그래머스 채용](https://career.programmers.co.kr/job) | 두 번의 web 요청 502 | 이번 선택 근거에서 제외 | 서비스 종료나 현재 UI 형태를 추정하지 않음 |

위 관찰만으로 전환율이나 검색 속도 개선 수치를 주장할 수 없다. DEMP의 덮임을 없애고 선택/URL/조회 일치를 실행 가능한 결과로 검증한다.

## 짧은 설계에 제시한 방향

1. 네 trigger 높이 44px·같은 좌측 정렬·동일 선택 강조. 단일 `openFilter` 소유자가 한 panel만 표시한다. 직무·기술은 항목 검색/native checkbox와 선택 개수, 모집 상태는 radio, 내 경력은 정확한 양의 정수 연차 입력과 1/3/5/10년 빠른 선택이다.
2. 직무/기술/모집 상태 선택은 기존대로 URL에 즉시 적용한다. 경력의 직접 입력은 유효할 때 적용 버튼/Enter로 반영하고, 아직 적용하지 않은 입력은 Esc/닫기 시 버린다. 0은 “경력 조건 없음” 해제 동작이다. 기존 유효한 URL의 연차를 임의 15년 한도로 잘라내지 않는다.
3. 적용 조건 chips와 결과의 원본은 route query. 검색어 draft는 검색 제출 전 chips/API에 넣지 않는다. 잘못된 연차는 안내하고 이전 URL/조회 조건을 보존한다. 뒤로/앞으로/새로고침·개별 해제·전체 초기화는 기존 계약을 유지한다.
4. desktop panel은 trigger에서 열리고 viewport 안에서만 배치한다. mobile은 기존 필터 펼치기 안에서 full-width normal flow로 표시한다. checkbox/radio를 menu role로 바꾸지 않고 fieldset/label과 실제 Tab/Space를 사용한다. 바깥 클릭/Esc는 닫고 Esc는 trigger로 포커스를 돌린다.
5. 주요 변경 위치는 AnnouncementHeader와 필터 한정 CSS, 기존 query helpers이며 API/DB는 변경하지 않는다. 새로운 필터 저장소나 UI library를 만들지 않는다. 제품 코드는 설계 승인 전 작성하지 않는다.

```text
버튼/checkbox/radio → Header 이벤트 → route query → 기존 목록/API
                                   ↓
                           선택 요약/checkbox 복원

검색어·연차 draft → 유효한 적용/제출 → route query
패널 열림/항목 검색 → 화면에서만 소유 (서버 조건과 분리)
```

구현 시 TDD acceptance: 단일 panel/바깥 클릭/Esc+포커스·항목 검색과 선택 보존·draft 검색어 혼입 방지·정확한 연차/잘못된 값 유지·URL 복원/페이지 초기화·EDU 경계. cmux 실제 Spring/H2와 320/390/1440px 겹침/containment/간격을 확인하고, 기존 development/production CI를 유지한다. 이후 동일한 승인 전달 범위로 PR→정확한 head CI→보호된 merge→main CI를 추적한다.

## 진행 상태

- 이전 UI Phase: frontend #6은 #7/main과 두 blob이 동일함을 확인해 닫음; 현재 frontend #9와 backend #7은 머지/main CI 완료. `/private/tmp/demp-question-ui-20261007/delivery-progress.json` 및 각 PR 설명에 최종 상태가 있음.
- 이 조사: 코드 읽기·공개 화면/공식 문서 비교·현재 겹침 측정 완료. 짧은 설계 승인 후 순차 TDD 구현 중.
- 다음 순서: 필터 구현/전달 완료→카드 밀도/회사·분야 시인성→조회수 실제 재현/수정→관리자 공고 등록 화면.
- 관리자 추가 요구: 사용자 스크린샷은 출처/게시, 기본 정보, 경력/연봉, 이미지/긴 상세 편집기가 하나의 큰 폼에 혼재한다. 후속 Phase에서 그룹/읽는 순서/간격/설명/동작 버튼 위치를 조사·설계한다. 현재 이 항목의 동작 재현이나 코드는 변경하지 않았다. 앞선 분 단위 날짜·기술 칩·고용 형태 개선은 #9에 머지됐지만 새 UI/운영 SQL은 아직 배포/적용하지 않았다.
