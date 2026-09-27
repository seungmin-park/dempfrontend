# Phase 1 T11/T13 프런트 검증

- 일자: 2026-09-14
- 브랜치: `refactor/data-preservation-and-security`
- 경로: `/Users/seungmin/Desktop/repo/archive/demp/.worktrees/data-preservation-and-security/frontend`
- 원본의 미커밋 Phase 0 기반(README, package/config, Jest smoke, docs)을 이 worktree에 복사했다. 원본은 수정하지 않았다. commit하지 않았다.

## 요구사항 → 근거 → 변경

로그인 자격 증명을 출력하지 않고 정상 성공·실패 흐름은 보존한다. 서버에 저장된 기존 HTML과 새 HTML 모두 출력 직전에 정화한다.

`npm test -- --runInBand`의 첫 실행은 실제 assertion 4개 실패/2개 통과였다.

- 로그인 성공 테스트는 token/username 저장과 redirect까지 통과했지만 console.log 호출이 0회가 아닌 2회(테스트 아이디·비밀번호)여서 실패했다.
- 질문·답변·공고의 실제 컴포넌트 렌더링 테스트 각각에서 script/img/event/style 요소가 남아 `Expected false / Received true`로 실패했다.
- 로그인 실패 안내·상태 유지와 Phase 0 smoke는 처음부터 통과했다. 이를 Red라고 부르지 않는다.

Green 최소 변경은 로그인 console.log 2줄 삭제, DOMPurify 3.4.15 정확 버전 의존성과 SafeHtml 추가, 기존 HTML 출력 3곳 교체다. 직후 전체 6개 테스트 통과를 확인했다.

```text
API 응답(기존·새 콘텐츠)
  → 질문 / 답변 / 공고 컴포넌트
  → SafeHtml(content)
  → DOMPurify의 태그·속성·URI 허용목록
  → 정화된 HTML만 DOM에 삽입
```

정화 책임은 SafeHtml 한 곳에 있다. 허용 태그는 b/strong/i/em/u/p/br/ul/ol/li/blockquote/pre/code/a, 속성은 href만이다. 링크는 http/https/mailto와 상대 주소를 허용한다. 임의 data/aria 속성, style, 이벤트, 이미지, SVG, MathML은 허용하지 않는다. 프로퍼티가 갱신되면 computed가 다시 정화한다. 정화 결과를 다른 HTML 변환기에 넘기지 않는다.

DOMPurify 구성 근거: [공식 README](https://github.com/cure53/DOMPurify#can-i-configure-dompurify). 정규식은 HTML을 정화하는 용도가 아니라 라이브러리 URI 정책을 제한하는 옵션이다.

Green 이후 15개 라이브러리 정책 특성화 테스트를 추가했다. 인코딩된 javascript, data/vbscript/ftp 차단, 허용 프로토콜·상대 링크 보존, 전체 서식, namespace와 임의 속성 제거, props 갱신·빈 문자열을 확인한다. 이 추가 테스트는 처음부터 통과했으며 새로운 Red로 기록하지 않는다.

## 실행 결과

Node 18.18.2/npm 9.8.1, 명령마다 해당 Node bin을 PATH 앞에 설정했다.

- `npm ci --ignore-scripts --no-audit --no-fund`: 성공, 1,627개 설치.
- `npm install dompurify --save-exact --ignore-scripts --no-audit --no-fund`: 성공, 2개 추가.
- `npm test -- --runInBand`: 전체 4 suites/21 tests 통과.
- 첫 lint: URI 정규식의 불필요한 하이픈 escape 1건. 문자 집합의 동일 의미를 유지하며 escape 제거.
- 첫 build: node-sass native binding이 설치 스크립트 생략으로 없어 Hashtags.scss의 PostCSS 변환 실패. 제품 기능 Red가 아닌 설치 환경 오류다. `npm rebuild node-sass`로 의존성 설치를 복구한다.

최종 lint/build 결과는 아래에 덧붙인다.

- `npm rebuild node-sass`: exit 0, native dependency 복구 성공.
- 최종 `npm test -- --runInBand`: exit 0, 4 suites/21 tests 통과.
- 최종 `npm run lint -- --no-fix`: exit 0, No lint errors found.
- 최종 `npm run build`: exit 0, hash `d033cc5a93f5357f`, Build complete.
- `git diff --check`: exit 0.
- `rg -n 'v-html' src`: `src/components/common/SafeHtml.vue` 한 곳만 남음.
- 남은 경고: 기존 caniuse-lite 데이터 노후, app entrypoint 권장 크기 초과. 보안 감사와 실브라우저 E2E를 수행한 것으로 주장하지 않는다.

정적 확인은 출력 지점이 하나임을 확인한 것이고, 실행 검증은 jsdom 컴포넌트 테스트에서 위험 요소 제거와 서식 보존을 확인한 것이다. 실제 악성 스크립트를 브라우저에서 실행한 검증으로 표현하지 않는다.
