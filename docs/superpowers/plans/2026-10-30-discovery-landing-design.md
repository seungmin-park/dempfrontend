# 탐색 랜딩 디자인 반영 계획

목표: 승인된 DEMP 목업을 실제 공고 탐색과 계정 흐름 위에 반영한다.
Phase: discovery landing design
브랜치: refactor/discovery-landing-design
Worktree: /private/tmp/dempfrontend-discovery-landing-design

## 범위와 책임

- `views/announcement/AnnouncementList.vue`: 랜딩 안내와 기존 검색/공고 컴포넌트를 조립한다.
- `components/announcement/DiscoveryIntro.vue`, `DiscoveryGuide.vue`: 히어로와 이용 설명만 표현한다. 가상 공고, 임의 통계와 후기, 인증 우회는 넣지 않는다.
- 기존 AnnouncementHeader → URL/emitter → AnnouncementList → API의 필터·정렬·로딩/오류/재시도 책임을 유지한다.
- `assets/styles/main.css`: Color Hunt #1B3C53/#234C6A/#456882/#E3E3E3, 공통 헤더와 카드 표현. 오류/성공의 의미 색은 유지한다.
- `assets/fonts`: Pretendard Variable을 라이선스와 함께 자체 제공한다.

## 인수 기준

- [x] Red: 랜딩 카피, 탐색 CTA의 실제 검색 영역 연결, 기존 목록/필터 조립을 검증하는 컴포넌트 assertion 실패를 실행한다.
- [x] Green: 새 표현 컴포넌트와 공통 스타일/폰트 반영, 대상 테스트 통과.
- [x] Refactor: 스타일 중복과 이름/책임 검토. API·라우트·JSON은 변경하지 않는다.
- [x] 전체 단위 테스트·구조 검사·typecheck·lint·build 및 개발/배포 fixture E2E.
- [x] 현재 cmux에서 실제 Spring 경로를 열고 검색·교육·인증 복귀와 320/390/1440px 가로 넘침, 로컬 Pretendard를 확인한다.
- [ ] 별도 리뷰 후 수정·재검증. PR 게시, 정확한 head의 필수 CI, native auto-merge, MERGED/merge SHA/main CI 관찰.

## 주의할 조건

기존 검색 URL·뒤로가기·초안·저장 의도를 보존한다. 모바일 필터의 터치 영역과 패널 위치, 긴 회사명/제목의 자연스러운 줄바꿈, 회원·관리자 헤더의 너비, 정보가 없는 공고의 표시, 서버 오류 시 기존 결과 보존을 검토한다. 상세는 현재 인증 정책을 따르므로 가입 없이 목록 탐색만 가능하다고 안내한다.

## 검증 기록

진행에 따라 실제 명령·실패/통과 결과·리뷰 근거를 추가한다. 미실행 검사를 통과로 간주하지 않는다.

### 1차 실행 근거

- Node 24.21.0 임시 런타임, `npm ci` 완료. 버전/의존성 변경 없음.
- baseline: sandbox 포트 제한 5건은 unrestricted 재실행에서 전체 374건 통과.
- Red: `npm test -- tests/unit/DiscoveryLanding.spec.js` → 기존 h1/인증 정책 안내 부재 assertion 2건 실패.
- Green: 동일 테스트 2건 통과. 전체 단위 376건, 구조·타입·lint·build 통과.
- 첫 전체 headed fixture: 246건 통과, 8건 실패. 신규 6건은 테스트 URL을 실제 `q` 대신 `title`로 작성한 테스트 오류였다. 제품의 조건 소실로 재현된 것이 아니므로 테스트를 기존 URL 계약에 맞게 고쳤다.
- 기존 responsive suite가 768px 필터 폭 149px를 검출했다. 기존 assertion 150px를 유지하고 필터 그룹 최소 폭을 150px로 수정했다.
- 별도 리뷰에서 critical/important 없음. 중복 CSS fallback 제거, 로컬 폰트를 src assets로 옮겨 public 복사와 Vite 번들 중복을 없앴다.

### 전체 검증과 최종 정리

- `npm run verify -- --headed`: 구조 위반 probe·strict 타입·단위 376건·lint·build·개발/배포 headed fixture 254건 모두 통과(2026-10-30 18:41 KST). 실제 DB 검증과 구분한다.
- cmux WebKit 실제 Vue 앱 320/390/1440px의 문서 폭이 화면 폭 이하, Pretendard 실제 로딩, `/?q=Java` → 탐색 CTA 이후 `Java` 유지 확인.
- 리뷰 후 독립 OFL 사본을 `public/fonts/LICENSE`에 보존해 최종 dist에도 라이선스가 배포되도록 했다. 폰트 바이너리는 src에서만 번들링한다.
- FAQ 키보드 열기/닫기, 축소 모션, 배포된 라이선스 응답을 기존 신규 E2E에 추가했다. 축소 모션에서는 버튼 active scale도 제거한다. 이 최종 소스로 전체 검증을 다시 실행하고 PR의 동일 head에서 CI 결과를 확인한다.
- 이름/책임: view는 조립, Intro/Guide는 안내·DOM reveal lifecycle만 담당하며 실제 데이터와 인증은 기존 소유자에 남긴다. 변경한 TS는 main의 CSS import뿐이며 새 추상 클래스/인터페이스를 만들지 않았다. 라우트/API/JSON 계약 변경 없음.
- 백엔드 코드는 변경하지 않는다. 현재 격리 H2용 Java25/Gradle 준비를 진행했으며 실제 Spring 경로의 결과는 PR 검증 기록에 별도로 남긴다.

### 최종 로컬 결과

- 최종 소스 전체 `npm run verify -- --headed`: 61개 suite, 단위 376건 / 개발·배포 fixture E2E 254건, skip·실패 없이 통과. 구조 probe·타입·lint·build도 통과. `.verification/summary.json` 및 단계별 로그가 실제 실행 증거다.
- 실제 Spring/H2: backend `069cea1b36df61c9ba0a6e20472d3dd9ff530bad`, Java Zulu25.36.205, 격리 메모리 DB `demp-landing`, backend18085/frontend5055. 비회원 검색 `로컬` → 관심 저장 → local 예제 로그인 → `q` 유지·저장 의도 소비 → 새로고침 저장 유지 → 상세 → 뒤로가기 `q` 유지 → 마이페이지 관심 목록 → 독립 HTTP200 ids[-1] → 해제/새로고침 → 독립 HTTP200 ids[]. 교육은 seed가 없어 빈 결과·전체 보기 안내를 확인했다. 실제 응답 없는 교육 성공 목록은 fixture E2E와 구분한다.
- cmux WebKit 320/390/1440px 문서 가로 넘침 없음, 로컬 Pretendard 로딩 확인. 브라우저 errors 없음. 캡처와 정리된 runtime JSON은 `.verification/landing-spring-desktop.png`, `.verification/landing-runtime.json`.
- 두 차례 독립 코드 리뷰에서 critical/important 없음. 라이선스 배포 지적은 해결했고, 최종 E2E에서 실제 OFL 응답을 검증한다.
- 사용자 추가 지시: 이후 작업은 headless로 수행하고 PC 사용을 방해하지 않는다. 기존 headed 실행은 종료되었다. PR/CI/병합 이후 단계는 창·pane·포커스 조작 없이 수행한다.
- 이 변경은 프런트 표현과 랜딩 연결에 한정한다. 백엔드 전체 suite는 재실행하지 않았으며 배포 작업은 수행하지 않는다. PR/CI/병합 최종 결과는 PR에 기록한다.
