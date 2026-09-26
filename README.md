# DEMP FRONDEND

## Phase 6 검증과 배포 순서

CI는 Node 18.18.2에서 `npm ci` → 단위 테스트 → lint → build → Chromium 설치 → `npx playwright test` 순서로 실행한다. 각 명령은 실패하면 그 작업을 중단한다. Playwright는 Vue 개발 서버를 자동으로 시작하며, 테스트마다 회원·공고·질문·답변 API fixture를 새로 만든다. 외부 CDN 요청은 차단하고 Summernote 입력 경계를 테스트 대역으로 바꾼다. 따라서 브라우저 E2E는 화면·라우팅·인증 상태·요청 및 응답 처리 흐름을 검증한다. 실제 Spring/DB/S3 결합 실행을 검증한 결과로 해석하지 않는다. Spring의 H2 기반 서비스·MVC·REST Docs 테스트는 백엔드 CI에서 별도로 실행한다.

양쪽 저장소의 같은 API 계약 커밋을 확인한 뒤 백엔드 CI와 프런트 CI를 모두 통과시킨다. 운영에서는 먼저 호환되는 백엔드를 배포해 `/api`와 인증·공고 응답을 확인하고, 이어 프런트 정적 산출물을 배포한다. 이상이 있으면 프런트 산출물을 직전 버전으로 되돌리고, 이어 백엔드를 직전 호환 버전으로 되돌린다. DB 변경이 포함된 배포는 사전 백업과 해당 변경의 별도 롤백 절차를 먼저 마련한다. 이 문서는 배포 실행 기록이 아니다.

## API 연결과 인증 (Phase 4 T41)

모든 HTTP 요청은 `src/api/client.js`의 Axios instance를 사용한다. 요청 직전에 Vuex의 토큰을 읽어 `X-AUTH-TOKEN`을 붙인다. API가 401을 반환하면 토큰과 사용자 이름을 함께 지우고, 현재 경로를 `redirect` query에 보존한 채 로그인 화면으로 이동한다. 보호 라우트는 토큰과 사용자 이름을 모두 요구하지만 토큰의 실제 유효성은 서버 응답으로 판단한다.

개발 서버는 기본적으로 `http://localhost:5050`에서 실행하고 `/api`를 `http://localhost:8080`으로 전달한다. 다른 백엔드는 `DEV_API_TARGET`으로 지정한다. 예시는 `.env.example`을 참고한다. 브라우저가 백엔드에 직접 접근해야 할 때만 `VUE_APP_API_BASE_URL`을 설정한다. 운영에서는 같은 출처의 `/api`를 reverse proxy로 백엔드에 전달하거나, 빌드 시 명시적인 `VUE_APP_API_BASE_URL`을 넣어야 한다. Express `server.js`는 정적 파일과 SPA 라우트를 제공할 뿐 API proxy는 제공하지 않으며, 전달되지 않은 `/api` 요청에는 JSON 404를 반환한다. 외부 출처 직접 호출은 백엔드의 `APP_CORS_ALLOWED_ORIGINS` 허용목록도 맞춰야 한다.

## Phase 1 프런트 보안 경계

로그인 자격 증명 콘솔 출력을 제거하고 질문·답변·공고 본문은 공통 SafeHtml에서 DOMPurify 허용목록으로 정화한다. 기존 데이터도 출력 직전에 보호한다.
2026-09-14 검증: 전체 21개 테스트, lint, production build 통과. [Red/Green 및 설치 복구 기록](docs/phase1-frontend-verification.md).

## 설치와 테스트 (Phase 0 T01, 2026-09-14 검증)

Node 18.18.2/npm 9.8.1에서 실행했다. 설치 복구를 위해 node-sass 7.0.1을 Dart Sass 1.77.8로 교체했고 Vue CLI Service 5.0.4를 유지한다.
lockfileVersion은 2이며, peer로만 해석되던 Vue 3.2.36을 같은 버전의 직접 의존성으로 선언했다.
기존 직접 의존성의 lockfile 해석 버전은 바뀌지 않았다.

```sh
node --version
npm --version
npm ci
npm test -- --runInBand
npm run lint -- --no-fix
npm run build
```

현재 worktree 검증: `npm ci` 1,627개 설치 성공, 전체 테스트 1 suite/1 test 통과,
lint 오류 없음, production build 성공. Browserslist 데이터 경고와 app entrypoint 크기 경고(368 KiB)가 남는다.
이번 설치 출력에는 audit 집계가 없으므로 과거 취약점 개수를 현재 결과로 제시하지 않는다.

```text
npm test → Vue CLI/Jest → Babel·Vue SFC 변환 → jsdom → mount → 버튼 DOM 텍스트 검증
```

먼저 `expect(false).toBe(true)`의 실제 assertion 실패(exit 1)를 확인한 후,
Vue 버튼을 mount하고 `질문하기` 텍스트를 확인하는 smoke 테스트로 교체해 통과(exit 0)했다.
이는 러너 실행 기반 검증이며 제품 버그 수정의 Red는 아니다. 제품 기능은 변경하지 않았다.
자세한 실행 증거와 범위는 [Phase 0 프런트 검증 기록](docs/phase0-frontend-verification.md)을 따른다.
백엔드 전체 검증 결과는 공동 작업 저장소의 [README](../backend/README.md)와
[Phase 0 작업 목록](../backend/tasks.md)에 별도로 기록한다.


1.공고/ 부트캠프 대시보드 + 로그인페이지, 질문 페이지 연결

![메인페이지](https://user-images.githubusercontent.com/78605779/169678839-aec25acb-38dd-49d5-b8e4-8adfde4c5852.PNG)

조건에 따른 필터링

![조건 필터링](https://user-images.githubusercontent.com/78605779/169678838-5e4af80b-7d91-4078-aed9-c31f94adeec8.PNG)

관리자 및 기업에서 공고를 등록하기 위한 페이지(크롤링을 통해 데이터를 가져올 예정으로 미 운영 계획)

![공고 등록페이지](https://user-images.githubusercontent.com/78605779/169678837-1672d7b3-80b7-4ead-a699-55f7434c9e0f.PNG)

2.질문 페이지 게시물에 존재하는 해시태그로 검색 및 생성일, 조회수, 추천수로 필터링 가능

![질문페이지](https://user-images.githubusercontent.com/78605779/169678836-551b3877-851f-4066-a588-3227f53f6331.PNG)

질문 상세 보기 및 질문과 동일한 해시태그 게시물 검색 가능, 댓글 달기 기능 추가

![질문 상세 페이지](https://user-images.githubusercontent.com/78605779/169678835-7019af61-c14c-4fb7-9202-95cb7eefb5f7.PNG)
