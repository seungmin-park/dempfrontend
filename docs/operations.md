# 프런트 운영·인증·배포

현재 기능·검증 결과는 [README](../README.md)를 참고한다.

## 검증과 배포 순서

CI는 Node 24.21.0에서 `npm ci` → 타입 검사 → 단위 테스트 → lint → build → Chromium 설치 → `npx playwright test` 순서로 실행한다. 각 명령은 실패하면 그 작업을 중단한다. Playwright는 Vue 개발 서버를 자동으로 시작하며, 테스트마다 회원·공고·질문·답변 API fixture를 새로 만든다. 외부 CDN 요청은 차단한다. 공통 Markdown 및 Tiptap 작성기의 입력·출력 계약을 검증한다. 따라서 브라우저 E2E는 화면·라우팅·인증 상태·요청 및 응답 처리 흐름을 검증한다. 실제 Spring/DB/S3 결합 실행을 검증한 결과로 해석하지 않는다. Spring의 H2 기반 서비스·MVC·REST Docs 테스트는 백엔드 CI에서 별도로 실행한다.

양쪽 저장소의 같은 API 계약 커밋을 확인한 뒤 백엔드 CI와 프런트 CI를 모두 통과시킨다. 운영에서는 먼저 호환되는 백엔드를 배포해 `/api`와 인증·공고 응답을 확인하고, 이어 프런트 정적 산출물을 배포한다. 이상이 있으면 프런트 산출물을 직전 버전으로 되돌리고, 이어 백엔드를 직전 호환 버전으로 되돌린다. DB 변경이 포함된 배포는 사전 백업과 해당 변경의 별도 롤백 절차를 먼저 마련한다. 이 문서는 배포 실행 기록이 아니다.

## API 연결과 인증 (Phase 4 T41)

모든 HTTP 요청은 `src/api/client.ts`의 Axios instance를 사용한다. 요청 직전에 Vuex의 토큰을 읽어 `X-AUTH-TOKEN`을 붙인다. API가 401을 반환하면 토큰과 사용자 이름을 함께 지우고, 현재 경로를 `redirect` query에 보존한 채 로그인 화면으로 이동한다. 보호 라우트는 토큰과 사용자 이름을 모두 요구하지만 토큰의 실제 유효성은 서버 응답으로 판단한다.

개발 서버는 기본적으로 `http://localhost:5050`에서 실행하고 `/api`를 `http://localhost:8080`으로 전달한다. 다른 백엔드는 `DEV_API_TARGET`으로 지정한다. 예시는 `.env.example`을 참고한다. 브라우저가 백엔드에 직접 접근해야 할 때만 `VITE_API_BASE_URL`을 설정한다. 운영에서는 같은 출처의 `/api`를 reverse proxy로 백엔드에 전달하거나, 빌드 시 명시적인 `VITE_API_BASE_URL`을 넣어야 한다. Express `server.cjs`는 정적 파일과 SPA 라우트를 제공할 뿐 API proxy는 제공하지 않으며, 전달되지 않은 `/api` 요청에는 JSON 404를 반환한다. 외부 출처 직접 호출은 백엔드의 `APP_CORS_ALLOWED_ORIGINS` 허용목록도 맞춰야 한다.


## 인증 저장·타입 호환성

TypeScript **6.0.3**, vue-tsc **3.3.11**, typescript-eslint **8.70.1**을 고정했다. 조사 시 latest TypeScript7은 lint parser의 지원 범위(`>=4.8.4 <6.1.0`) 밖이므로 공통 지원 최신 안정판 6.0.3을 사용한다. Vuex4의 package exports에 types 항목이 없어 tsconfig의 `vuex` 경로만 패키지에 포함된 공식 `types/index.d.ts`로 연결했다. 구현을 `any`로 선언해 우회하지 않는다.

인증 저장은 작은 `persistAuthentication` Vuex plugin이 맡는다. 기존 localStorage `vuex` 키와 `{ Login: { username, token } }` 모양은 유지한다. JSON을 `unknown`으로 읽어 문자열인지 확인하고, 손상된 값은 로그아웃 상태로 처리한다. 저장 거부 시 현재 메모리 세션은 동작하지만 새로고침 후 로그인 유지가 보장되지 않는다. `vuex-persistedstate`와 그 하위 `shvl`을 제거했다.


### 배포·롤백

`npm ci`로 lockfile 설치 후 `npm run build`의 `dist`를 배포한다. 환경변수는 빌드 때 결정된다. Node 서버를 사용하는 배포는 Node24와 `server.cjs` 시작 명령으로 함께 변경한다. 이전 `dist`와 이전 Node18 서버/lockfile을 한 세트로 보관하고 롤백 시 함께 복원한다. 백엔드는 호환성을 먼저 검증한 산출물을 사용한다.
