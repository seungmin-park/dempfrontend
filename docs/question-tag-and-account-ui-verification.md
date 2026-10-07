# 질문·태그·계정 UI 검증 기록

2026-10-07. Phase `question-tag-and-account-ui`, branch `refactor/question-tag-and-account-ui`, base `39bc0a00c9d86faad6e7af4b634aab2419a8c365`. 18:32 사용자의 PR·CI·merge 관리 요청에 따라 최종 리뷰 후 보호된 전달까지 진행한다. 아직 미커밋이며 원격 CI·머지 결과는 확인 후 기록한다. [계획](superpowers/plans/2026-10-07-question-tag-and-account-ui.md)이 순차 진행과 대기 항목을 관리하며 [기능 지도](engineering/feature-map.md)와 [책임 경계](engineering/architecture.md)가 최종 동작의 진입점이다.

## 관찰과 변경

| 사용자 문제 | Red 근거 | 최소 변경 | 관찰한 결과 |
|---|---|---|---|
| 모집 시각에 불필요한 초 표시 | 기존 값 17:56:53이 그대로 입력됨 | 분 단위 표시와 실제 저장값 분리 | 변경하지 않은 초는 보존; cmux 두 입력이 step 60·유효함 |
| 태그 입력·오류·도움말 겹침 | 초기 태그·disabled·오류 연결 3개 실패; cmux 오류 gap -11px | flex 정렬, 정상 흐름 오류, 초기 태그/disabled props | 대상 통과; cmux gap 9px·입력 중심 차이 0px |
| URL에만 선택 태그 반영 | 표시·checkbox·저장 중 비활성 3개 실패 | query 원본에서 표시/해제/checkbox 도출 | 실제 상세 #Docker 클릭→선택 표시→해제와 URL assertion 통과 |
| 본인 질문 편집 진입 없음 | 링크·초기 복원·PATCH·타인 진입 4개 실패 | 기존 작성 화면과 서버 작성자 API 재사용 | 실제 저장·새로고침 후 제목/서식/태그와 질문·답변 반응 보존 |
| 관리자 footer 항상 노출 | 권한 확인 없는 노출·API 미호출 4개 실패 | readonly 서버 판정 및 요청 세대 비교 | 실제 비회원·일반회원 숨김, 관리자 표시; 단위 지연 응답 통과 |
| 인턴과 경력 구분 혼동 | frontend 선택/복원/저장/표시 12개 실패; backend 입력/DB 별도 Red | nullable 고용 형태·서버 상태 규칙·공통 배지 | 실제 cmux 전환형 인턴+신입 저장→재조회→목록/상세; MySQL 네 값·null·교육 전환 25 assertions |
| 기술 스택의 작은 클릭 영역과 불균일 정렬 | 전체 label 클릭·선택/disabled 표시 2개 실패 | native checkbox와 텍스트 span을 40px 칩·gap 8px로 배치 | 실제 전체 칩 클릭·저장/재조회; 320/390/1440px 모두 높이 40px·가로 넘침 없음 |
| 변경 이력의 번호·텍스트가 가운데로 흩어짐 | 접근 가능한 목록/값/순서 assertion 1개 실패 | 안내용 중앙 정렬과 분리한 이력 section/list | 실제 4행·긴 제목, 세 viewport 왼쪽 정렬·제목 간격 8px·시작 위치 차이 0px |

## 실행 경계와 증거

현재 cmux 호출 workspace `workspace:1000000002`, 보조 pane `pane:1000000004`: runner `surface:1000000006`, 서버 로그 `surface:1000000011`, 실제 WKWebView `surface:1000000009`를 사용했다. Vite `127.0.0.1:51017`, Spring `127.0.0.1:18081`, 현재 독립 H2 `demp_employment_ui_20261007`이며 운영 DB·파일 저장소는 사용하지 않았다.

최초 질문/태그 검증은 기존 CI JAR `c206626e…`와 H2 `demp_question_ui_20261007`였다. 고용 형태부터는 backend base `7ad8fab`에 현재 미커밋 변경을 더한 전체 verify 통과 JAR SHA256 `f38cc4c1ddd604405470ebbde2e6c8d522dc5d32f219582510a23ea0aa5d338e`로 서버를 새로 시작했다. `employment-runtime/runtime.json`이 source·dirty·JAR hash·PID·DB를 기록한다. 프런트는 현재 worktree의 Vite이며 HEAD commit만의 산출물이라고 주장하지 않는다. 이후 REST Docs request part 변경까지 backend 전체 verify를 다시 실행해 390건·패키지/서빙 문서·실제 반응 commit/switch/cancel이 통과했다. 운영 코드 변경은 없으며 현재 서버는 새 문서만 재패키징한 JAR보다 앞선 동일 production 코드다.

세션 명령·종료 코드·원본 로그·화면은 `/private/tmp/demp-question-ui-20261007/`의 `{label}.json`·`.log` 및 화면/DOM 증거에 있다. 18:44 최종 전체 unit 267/267, typecheck·contracts/probe·lint·build exit 0. `final-frontend-*`와 `final-backend-verify`가 명령/코드를 기록한다.

Playwright development/production fixture와 반응형 회귀를 유지·추가했다. discovery로 테스트 수집을 확인했으며 실행 통과와 구분한다. 사용자 요청에 따라 로컬 Chrome for Testing은 실행하지 않았고 CI 브라우저 실행은 남아 있다. cmux 실제 서버 검증은 fixture suite를 대체한 통과가 아니다.

새 runtime에서 실제 클릭/입력→본인 질문 저장→페이지 재진입으로 제목·h2·u·태그 7개와 질문 추천/답변 비추천을 확인했다. 상세 #Docker 클릭→URL/선택 표시→해제도 통과했다. 320/390/1440px에서 태그가 4/3/1줄이고 오류 gap 8px·도움말 gap 9px·가로 넘침 없음이었다. 제목 필수 오류에도 본문/태그가 남았다. 서버 저장 실패·동시 저장·지연 응답은 단위/CI API 경계 검증이며 실제 cmux에 네트워크 장애를 주입하지 않았다. 실제 다른 회원 `local-other`의 상세에는 편집 링크가 없고 직접 편집 URL도 안내와 form 숨김을 확인했다. 최초 서버 403은 관리자에게 ROLE_USER가 없는 격리 fixture 조건이었고 새 runtime은 관리자+일반회원 역할을 함께 갖춘다.

중간 DOM assertion은 반응 영역 밖 편집기의 `aria-pressed` 버튼까지 읽고 접근성 라벨을 textContent로 오인해 실패했다. 실제 DOM을 확인하고 `.reaction-control`의 `aria-label`/`aria-pressed`로 범위를 고쳐 질문 추천 1·답변 비추천 1 보존을 확인했다. 의도한 제품 실패와 검증 코드 오류를 구분한다.

## 이름·책임 검토

`updateQuestion`은 PATCH 저장 효과, `queryTags`는 URL 해석, `useAdminAccess`는 서버 권한 판정을 나타낸다. 기존 태그 `addHashtags` 이벤트와 HTTP 필드·DB 값은 유지한다. `QuestionWrite`는 같은 작성/편집 입력과 유스케이스를 조정하고 API 모듈이 transport를 소유한다. `AnnouncementAudience`는 경력/고용 형태의 공통 표현을 맡는다. 기술 칩은 native label/input, 이력은 서버 값/순서의 렌더링으로 기존 editor에 둔다. 공백 문자를 위치 맞춤에 쓰지 않고 CSS gap/padding/flex-wrap을 쓴다. `time`은 날짜, span은 작성자/상태, p는 제목이라는 표현 역할을 가진다. View는 route 조립, 컴포넌트는 props/event·렌더링/입력 책임으로 검토했다. 별도 상태 저장소나 단순 위임 클래스를 추가하지 않았다.

## 남은 순차 작업

현재 Phase의 최종 리뷰·PR·정확한 head CI·보호된 merge·main CI가 남는다. 그 뒤 시장조사/필터→카드→조회수를 순차 진행한다. 운영 DB SQL과 새 UI 배포는 아직 실행하지 않았다. 기존 파비콘의 승인된 배포는 SSH 인증 대기다.
