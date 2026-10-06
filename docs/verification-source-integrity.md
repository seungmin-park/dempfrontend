# 검증 입력 무결성 개선

2026-10-06, Codex Security Cloud의 프런트 검사 `wfr_629f53c08e0c8478305ee61d5a75a39afdd3eb484cc55b1d838b09a267121fb3` 중 `csf_d038dec2278d7d239d5f4992`에 대응한다. 검사 대상과 시작 HEAD는 `7f63e0640216ba5486d9af79c454d56e47565682`다. Phase는 검증 입력 무결성 보강, 브랜치는 `refactor/verification-source-integrity`, worktree는 `/Users/seungmin/Desktop/repo/archive/demp/.worktrees/verification-source-integrity/frontend`다. 사용자가 승인한 첫 설계 범위이며 commit·push·보안 finding 종료는 수행하지 않는다.

## 요구사항과 관찰

기존 `npm ci`는 기준 해시 생성 전에 실행됐고 해시 수집의 allowlist에는 `index.html`, `public/`, `server.cjs`, ignored 로컬 환경 파일이 없었다. 따라서 설치 시 입력이 바뀌거나 검증 중 제외 파일이 바뀌어도 성공 증거를 만들 수 있었다.

```text
기록한 Git SHA → 설치 전 입력 기준
                     ↓
              설치·검증 단계 전후 비교
                     ↓
              입력·빌드 결과·종료 코드 → 증거
```

`verification-source.mjs`는 Git/파일 입력의 수집·비교를 맡고 `verify.mjs`는 프로젝트 명령의 실행 순서·결과 계약을 맡는다. 일반 객체 간 단순 위임 계층이나 앱 상태·API 의존성을 만들지 않았다. 이름 `captureSource`·`assertSource`는 기준 수집과 변경 거부라는 실제 효과와 일치한다. 앱의 Vue props/event·TS API·HTTP JSON 계약은 변경하지 않았다.

## Red → Green → Refactor

- 시작 검증: 기존 `CiVerification.spec.js` 23개 통과.
- 첫 Red: `asdf exec npm test -- tests/unit/VerificationSource.spec.js`. 정상 입력 1개 통과, 입력 4종 변조는 기대한 종료 코드 1 대신 0으로 실제 실패했다. 앞선 loopback `EPERM` 환경 실패는 Red로 세지 않았다.
- 첫 Green: tracked 전체와 생성 경로를 제외한 추가 입력을 수집한 뒤 같은 5개 통과. 전체 209개 통과.
- 두 번째 Red: CI 기준 누락·로컬 환경 파일 혼입·변조 이후 빌드 진행·설치 중 변경이 새 기준으로 수용되는 동작을 실제 재현했다. 마지막 사례는 기대한 1 대신 0, 후속 빌드 차단 사례는 실제 `VERIFY: build` 출력 때문에 실패했다.
- Green과 책임 분리: 설치 전 기준을 강제하고 단계 전후에 비교한다. 입력 수집을 `verification-source.mjs`로 분리했다. 대상 10개, 전체 214개 통과.
- CLI 경로 회귀: macOS의 `/var` → `/private/var` 경로 해석으로 외부 복사본의 CLI가 실행되지 않았다. 원래 테스트의 설치 후 변경 거부 assertion이 실패했고 실제 경로를 대조했다. `realpathSync` 비교로 수정하고 기준 파일 생성·PASS 출력 assertion을 보강했다. 대상 11개 통과.
- CI 설치 블록 회귀: 실제 workflow의 run 블록을 임시 Git 저장소에서 실행했다. 설치 훅이 공개 자산과 외부 검사기를 함께 바꾸면 기존 블록이 종료 코드 0으로 통과해 Red를 확인했다. CI 검사를 고정 SHA의 Git 객체에서 stdin으로 직접 실행하도록 변경했다.
- 리뷰 회귀: index의 `assume-unchanged`와 입력 기준 파일을 함께 조작한 지속적 변조, Git 검사 코드 조회 실패가 실제 CI 기본 shell에서 성공으로 처리되는 상황을 각각 종료 코드 0으로 재현했다. CI는 실제 파일 목록·내용·실행 비트를 Git tree·blob과 직접 비교하며 `defaults.run.shell: bash`를 명시한다. 테스트도 실제 YAML shell 선택을 따른다.
- Git replacement 회귀: 자산 blob 또는 검사기 blob을 replacement ref로 바꿔 고정 SHA의 읽기를 우회한 두 설치 훅도 종료 코드 0으로 재현했다. 모든 검증용 Git 조회에서 `--no-replace-objects`를 지정한다.

임시 저장소의 프로젝트 하위 명령은 제어된 보고서·빌드 파일을 만드는 fixture다. 실제 coordinator·검사기·validator·CI run 블록을 실행하며 실서비스 E2E라고 표현하지 않는다. 기존 Playwright 전체 사용자 흐름은 별도로 유지한다.

## 검증 결과

수정 전 전체 headed 검증은 단위 216개와 브라우저 160개를 통과했다. 이후 리뷰에서 위 두 우회를 발견해 회귀 테스트와 구현을 추가했다. 현재 코드의 최종 전체 결과·종료 코드는 `.verification/summary.json`, `.verification/unit.json`, `.verification/e2e.json`과 단계별 로그에 남긴다. 실행 화면은 호출 workspace:3의 기존 보조 pane:10/surface:11에 유지한다. API fixture 기반 headed 흐름을 실제 Spring 저장 검증으로 표현하지 않는다.

## 범위와 다음 개선

입력 변경의 체크포인트 검증이며 같은 단계 안에서 변조·이용·원복하는 프로세스를 격리하거나 재현 가능한 빌드를 증명하는 체계는 아니다. GitHub CI 실행은 commit·PR 전달 이후 별도로 확인해야 한다. 보안 finding은 자동 종료하지 않는다.

다음 순서는 로그인 보호 → 답변·태그 자원 제한 → 공고 이미지 접근 제어 및 프런트 방어다. 백엔드 외부 이미지 차단은 실제 `AnnouncementBodyImagesTest` 5개와 `AnnouncementImageUrlTest` 1개, 실패·오류·skip 0으로 확인했다. 이 결과는 프런트의 임의 URL 정책이나 실제 버킷 공개 설정까지 검증한 결과가 아니다.
