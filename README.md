# DEMP

## 검증과 배포 순서

CI는 Node 24.21.0에서 `npm ci` → 타입 검사 → 단위 테스트 → lint → build → Chromium 설치 → `npx playwright test` 순서로 실행한다. 각 명령은 실패하면 그 작업을 중단한다. Playwright는 Vue 개발 서버를 자동으로 시작하며, 테스트마다 회원·공고·질문·답변 API fixture를 새로 만든다. 외부 CDN 요청은 차단하고 Summernote 입력 경계를 테스트 대역으로 바꾼다. 따라서 브라우저 E2E는 화면·라우팅·인증 상태·요청 및 응답 처리 흐름을 검증한다. 실제 Spring/DB/S3 결합 실행을 검증한 결과로 해석하지 않는다. Spring의 H2 기반 서비스·MVC·REST Docs 테스트는 백엔드 CI에서 별도로 실행한다.

양쪽 저장소의 같은 API 계약 커밋을 확인한 뒤 백엔드 CI와 프런트 CI를 모두 통과시킨다. 운영에서는 먼저 호환되는 백엔드를 배포해 `/api`와 인증·공고 응답을 확인하고, 이어 프런트 정적 산출물을 배포한다. 이상이 있으면 프런트 산출물을 직전 버전으로 되돌리고, 이어 백엔드를 직전 호환 버전으로 되돌린다. DB 변경이 포함된 배포는 사전 백업과 해당 변경의 별도 롤백 절차를 먼저 마련한다. 이 문서는 배포 실행 기록이 아니다.

## API 연결과 인증 (Phase 4 T41)

모든 HTTP 요청은 `src/api/client.ts`의 Axios instance를 사용한다. 요청 직전에 Vuex의 토큰을 읽어 `X-AUTH-TOKEN`을 붙인다. API가 401을 반환하면 토큰과 사용자 이름을 함께 지우고, 현재 경로를 `redirect` query에 보존한 채 로그인 화면으로 이동한다. 보호 라우트는 토큰과 사용자 이름을 모두 요구하지만 토큰의 실제 유효성은 서버 응답으로 판단한다.

개발 서버는 기본적으로 `http://localhost:5050`에서 실행하고 `/api`를 `http://localhost:8080`으로 전달한다. 다른 백엔드는 `DEV_API_TARGET`으로 지정한다. 예시는 `.env.example`을 참고한다. 브라우저가 백엔드에 직접 접근해야 할 때만 `VITE_API_BASE_URL`을 설정한다. 운영에서는 같은 출처의 `/api`를 reverse proxy로 백엔드에 전달하거나, 빌드 시 명시적인 `VITE_API_BASE_URL`을 넣어야 한다. Express `server.cjs`는 정적 파일과 SPA 라우트를 제공할 뿐 API proxy는 제공하지 않으며, 전달되지 않은 `/api` 요청에는 JSON 404를 반환한다. 외부 출처 직접 호출은 백엔드의 `APP_CORS_ALLOWED_ORIGINS` 허용목록도 맞춰야 한다.

## Phase 1 프런트 보안 경계

로그인 자격 증명 콘솔 출력을 제거하고 질문·답변·공고 본문은 공통 SafeHtml에서 DOMPurify 허용목록으로 정화한다. 기존 데이터도 출력 직전에 보호한다.
2026-09-14 검증: 전체 21개 테스트, lint, production build 통과. [Red/Green 및 설치 복구 기록](docs/phase1-frontend-verification.md).

## 설치·개발·검증 (Phase 7)

`.tool-versions`의 asdf Node **24.21.0 LTS**와 Zulu Java 25를 사용한다. Vue 3.5.43 / Router 5.3.1 / Vuex 4.1, Vite 8.3.1, Vitest 5.0.2, ESLint 10 기반이다. Vue에는 고정 LTS 채널이 없어 최신 안정판을 선택했다.

```sh
asdf install
node --version
npm ci
npm test
npm run typecheck
npm run lint -- --no-fix
npm run build
DEV_API_TARGET=http://127.0.0.1:18080 npm run dev
```

기존 `npm run serve`는 `dev`와 같은 Vite 서버를 실행한다. 새 환경변수는 `VITE_API_BASE_URL`이며 기존 `VUE_APP_API_BASE_URL`도 전환 기간에 지원한다. 둘 다 없으면 같은 출처 `/api`를 사용한다. 정적 서비스는 `npm start`(`server.cjs`)이며 `/api` reverse proxy는 배포 환경에서 설정한다.

```text
Vue SFC → Vite → 정적 dist
DOM·API 계약 테스트 → Vitest + jsdom
자동 사용자 흐름 → Playwright fixture → 실제 API 연결은 별도 cmux 브라우저
```

현재 local E2E는 cmux 보조 터미널의 러너 로그와 내장 브라우저의 실제 클릭·입력·스크롤을 함께 확인한다. CI에서는 headless 자동 실행한다. Playwright가 API를 대역으로 제어하는 검증과 실제 Spring 임시 H2 검증은 다른 범위다.

### TypeScript 경계와 인증 저장

제품 코드는 `src/**/*.ts`, 모든 Vue SFC의 `<script lang="ts">`로 전환했다. `npm run typecheck`는 `strict` 모드로 DTO, 인증 store, router, 이벤트, 비동기 상태와 템플릿을 검사하며 CI의 필수 단계다. API 계약은 `src/types/api.ts`에 있으며 백엔드의 `answerId`, `announcementType`, Slice의 `content/number/last`, nullable 레거시 값을 따른다.

TypeScript **6.0.3**, vue-tsc **3.3.11**, typescript-eslint **8.70.1**을 고정했다. 조사 시 latest TypeScript7은 lint parser의 지원 범위(`>=4.8.4 <6.1.0`) 밖이므로 공통 지원 최신 안정판 6.0.3을 사용한다. Vuex4의 package exports에 types 항목이 없어 tsconfig의 `vuex` 경로만 패키지에 포함된 공식 `types/index.d.ts`로 연결했다. 구현을 `any`로 선언해 우회하지 않는다.

인증 저장은 작은 `persistAuthentication` Vuex plugin이 맡는다. 기존 localStorage `vuex` 키와 `{ Login: { username, token } }` 모양은 유지한다. JSON을 `unknown`으로 읽어 문자열인지 확인하고, 손상된 값은 로그아웃 상태로 처리한다. 저장 거부 시 현재 메모리 세션은 동작하지만 새로고침 후 로그인 유지가 보장되지 않는다. `vuex-persistedstate`와 그 하위 `shvl`을 제거했다.

제품 코드의 명시적 `any`, `@ts-ignore`, `@ts-nocheck`는 없다. `skipLibCheck`는 외부 라이브러리 선언끼리의 검사만 생략하며 앱의 strict 검사를 끄지 않는다. DOM ref는 해당 template의 input/Element 타입으로 좁힌다. 기존 CDN Summernote 경계는 실제 사용하는 두 오버로드만 선언했고 공통 Markdown 작성기 적용 때 함께 제거한다. 도구 설정, `server.cjs`, 기존 단위/E2E 테스트는 JavaScript로 남겼다. `tests/types/api-contracts.ts`는 잘못된 JWT 타입이 계속 거절되는지도 검사한다.

2026-09-27: 단위 19 suites/54 tests, strict typecheck·lint·build 통과. cmux 검증 pane에서 Playwright 모의 API 흐름 7개와 실제 Spring/H2 요청 14개 assertion 통과. 내장 브라우저의 실제 로그인·새로고침·스크롤 검증은 모의 API 테스트와 구분한다. TypeScript 전환은 API/DB 저장 형식을 변경하지 않으며 롤백 시 기존 `vuex` 인증 저장을 그대로 읽을 수 있다.

### 공고 인피니티 스크롤

목록 끝이 보이면 다음 페이지를 요청한다. 진행 중 요청·마지막 페이지·오류 상태에서는 자동 요청을 반복하지 않는다. 필터가 바뀌면 첫 페이지부터 다시 시작하고 이전 요청의 늦은 응답은 폐기한다. 겹치는 ID는 중복 표시하지 않는다. 자동 감지가 없는 환경에서도 더보기와 재시도를 사용할 수 있다.

### 배포·롤백

`npm ci`로 lockfile 설치 후 `npm run build`의 `dist`를 배포한다. 환경변수는 빌드 때 결정된다. Node 서버를 사용하는 배포는 Node24와 `server.cjs` 시작 명령으로 함께 변경한다. 이전 `dist`와 이전 Node18 서버/lockfile을 한 세트로 보관하고 롤백 시 함께 복원한다. 백엔드는 호환성을 먼저 검증한 산출물을 사용한다.

과거 단계의 검증 건수와 도구는 [Phase 0 기록](docs/phase0-frontend-verification.md), [Phase 1 기록](docs/phase1-frontend-verification.md)에 보관한다. 디자인 개편과 관리자 화면은 후속 작업이며 제품 이름은 DEMP로 유지한다.

## 초기 화면 기록

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
