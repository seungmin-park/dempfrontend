# DEMP FRONDEND

## Phase 1 프런트 보안 경계

로그인 자격 증명 콘솔 출력을 제거하고 질문·답변·공고 본문은 공통 SafeHtml에서 DOMPurify 허용목록으로 정화한다. 기존 데이터도 출력 직전에 보호한다.
2026-09-14 검증: 전체 21개 테스트, lint, production build 통과. [Red/Green 및 설치 복구 기록](docs/phase1-frontend-verification.md).

## 설치와 테스트 (Phase 0 T01, 2026-09-14 검증)

Node 18.18.2/npm 9.8.1에서 실행했다. 기존 node-sass 7.0.1과 Vue CLI Service 5.0.4를 유지한다.
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
