# Phase 0 T01 프런트 테스트 실행 기반 검증

- 검증일: 2026-09-14 (Asia/Seoul)
- 브랜치: `refactor/build-and-test-foundation`
- worktree: `/Users/seungmin/Desktop/repo/archive/demp/.worktrees/build-and-test-foundation/frontend`
- 범위: T01 프런트 runner/config/smoke/설치 문서. 제품 소스 변경 없음.

## 요구사항과 관찰 근거

기존 package.json에 test 명령과 Vue 직접 의존성 선언이 없었다. 기존 lockfileVersion 2에서 Vue는 3.2.36으로 해석된다.
Node 18.18.2/npm 9.8.1을 사용했고 CLI Service 5.0.4 및 node-sass 7.0.1을 유지했다.
설정과 lockfile은 기존 검증 커밋 `0887907`에서 재사용했지만 아래 명령과 Red/Green은 현재 worktree에서 새로 실행했다.
기존 직접 의존성 각각의 이전/변경 lockfile 해석 버전을 비교한 결과 변경 목록은 `[]`였다.

## 변경과 책임

- `package.json`: 표준 test 명령, Vue 3.2.36 직접 선언, Vue CLI unit-jest 5 계열·Vue Test Utils 2.0.2·Vue3 Jest 27.0.0 추가, 테스트 파일에만 Jest ESLint 환경 적용.
- `package-lock.json`: lockfileVersion 2 유지, 테스트 도구 의존성 반영.
- `jest.config.js`: Vue CLI preset, jsdom, Vue 3 SFC transformer 연결.
- `babel.config.js`: test 환경의 자동 polyfill 주입을 끄고 기존 제품 빌드의 usage 설정 유지.
- `tests/unit/test-environment.spec.js`: 버튼 mount와 공개 DOM 텍스트 확인, 종료 후 unmount.

```text
npm test
  → Vue CLI가 Jest 실행
  → Babel은 JavaScript, vue3-jest는 .vue 변환 담당
  → jsdom이 DOM 제공
  → Vue Test Utils가 mount
  → 버튼의 실제 렌더링 텍스트 확인
```

최종 smoke는 inline template을 사용하므로 `.vue` 파일 변환 자체를 독립적으로 검증한 테스트는 아니다.
후속 제품 테스트는 렌더링·사용자 입력·props/emitted event 계약을 중심으로 추가한다.

## 실제 실행 결과

모든 npm 명령에 `PATH=/Users/seungmin/.asdf/installs/nodejs/18.18.2/bin:$PATH`를 적용했다.

| 단계 | 명령 | 이번 실행 결과 |
| --- | --- | --- |
| 설치 | `npm ci` | exit 0, added 1627 packages in 51s |
| Red | `npm test -- --runInBand` | exit 1, 1 suite/1 test failed, Expected true / Received false |
| Green / 전체 | `npm test -- --runInBand` | exit 0, 1 suite/1 test passed, 0 snapshots |
| lint | `npm run lint -- --no-fix` | exit 0, No lint errors found |
| build | `npm run build` | exit 0, Build complete, hash 149bdee4deceee2a |

Red는 아래 의도적 assertion을 먼저 파일에 쓰고 실행했다.

```js
test('테스트 러너가 assertion 실패를 보고한다', () => {
  expect(false).toBe(true)
})
```

실패 원인은 환경 오류가 아니라 `Expected: true / Received: false` assertion이었다.
T01 지시대로 이 예제를 `mount({ template: '<button>질문하기</button>' })` 후
`wrapper.get('button').text()`가 `질문하기`인지 확인하는 테스트로 교체했다.
제품 버그의 Red로 계산하지 않는다. 별도 제품 코드 Refactor는 하지 않았다.

## 한계와 후속 작업

- 설치 과정에서 기존/전이 패키지 deprecation 경고가 출력되었다. 이번 출력에 npm audit 집계는 없으며 보안 감사는 수행하지 않았다.
- test/lint/build에 오래된 caniuse-lite 경고가 남는다.
- build의 app entrypoint는 368 KiB로 권장 244 KiB를 초과한다. 컴파일은 성공했다.
- smoke 1개는 테스트 실행 기반을 확인하며 제품 기능 전체의 정확성을 보장하지 않는다.
- 백엔드 테스트 결과는 공동 작업의 backend README/tasks.md 기록을 참조한다. 과거 전체 테스트 수를 현재 결과로 복사하지 않았다.
