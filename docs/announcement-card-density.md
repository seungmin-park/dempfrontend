# 공고 카드의 밀도와 회사·직무 표시

2026-10-07. 사용자가 큰 카드와 회사·분야의 낮은 시인성을 지적했다. 큰 배너를 56px 썸네일로 줄이고 회사·직무 → 제목 → 모집 대상/고용 형태 → 기술/마감 순으로 읽는 짧은 설계를 제시했으며, 사용자의 “진행” 지시 후 구현했다. Phase `announcement-card-density`, branch `refactor/announcement-card-density`, worktree `/Users/seungmin/Desktop/repo/archive/demp/.worktrees/announcement-card-density/frontend`, base `a26c416461ed082da145205197ee986c55900c66`.

## 관찰과 비교

- 기존 공개 카드: 1440px에서 344×447.86px, 이미지 176px; 390px에서 341×442.86px, 이미지 178px. 회사 12px·직무 11px였다.
- [원티드 개발 채용 목록](https://www.wanted.co.kr/wdlist/518)을 Firecrawl로 읽고 제목·회사·경력 정보가 존재함을 확인했다. 이 수집 결과만으로 치수나 전환율은 주장하지 않는다. [점핏](https://jumpit.saramin.co.kr/positions)은 직무/필터만 수집되고 카드 본문이 누락돼 카드 배치의 근거에서 제외했다. 원문은 `/private/tmp/demp-announcement-card-density-20261007/.firecrawl/`에 보존했다.
- 기존 primary/ink/muted/meta/line/surface/canvas와 Pretendard 글꼴을 유지했다. 작은 이미지와 명확한 회사·직무가 비교의 출발점이며 장식·새 상태·새 API를 추가하지 않는다.

## 변경과 책임

`AnnouncementList`는 기존 공고 조회·페이지 누적·응답 세대·로그인/상세 이동을 그대로 조정한다. 카드 markup은 전달받은 summary의 표시 순서만 바꿨다. `AnnouncementAudience`, `CompanyImage`, 기존 formatters의 공개 계약은 유지했다.

```text
route 조건 → AnnouncementList → announcements API → 서버 summary
                      ↓
            회사/직무 · 제목 · 공통 모집 표시 · 기술/마감
카드 click/Enter → 기존 상세 route (query 보존)
```

이미지는 56px 정사각형·object-fit cover, 회사 16px·직무 13px·제목 16px이다. 본문 16px padding/12px gap, 회사 영역 min-width 0과 overflow-wrap anywhere를 사용한다. 높이를 고정하거나 제목/교육 정보의 줄 수를 제한하지 않는다. 기존 공고의 큰 이미지는 썸네일에서 일부 crop될 수 있으며 새로운 로고 데이터라고 표현하지 않는다. 빈/실패 이미지는 기존 DEMP fallback이다.

Refactor: 목록 전용 전역/media CSS 18개를 scoped CSS로 옮겼다. 전역 span·공백 문자·추가 margin 덧씌우기로 정렬하지 않는다. grid의 열/폭, 공통 모집 배지, 상세/관련 공고의 규칙은 공유 영역에 남았다. 기존 `openAnnouncementDetail`, `loadNextPage`, 검색 조건·requestGeneration 이름과 공개 URL/API를 유지할 근거는 이번 변경이 표현 순서/치수만 소유하기 때문이다. 기존 TS API/formatters의 책임을 바꾸지 않았고 Vue는 props/event·표현/상태/API 경계로 검토한다.

## Red → Green과 실제 실행

- Baseline 49 files/288 unit assertions exit 0.
- `card-order-red`: 1 fail/9 pass, 회사 뒤에 직무가 오지 않는 실제 DOM assertion 실패. 회사·직무를 heading에 먼저 배치하고 제목 뒤로 모집 정보를 옮긴 `card-order-green` 10/10 exit 0. `order-suite` 289/289 exit 0.
- CSS Red: 실제 cmux의 320px에서 이미지 244×178px, 회사 12px·직무 11px; 56px assertion 실패. CSS Green: 320/390/640/768/1024/1440px의 24 assertions exit 0. 같은 로컬 공고의 320px 높이 405.67→239.5px, 약 41% 감소. 공개 공고와 로컬 seed는 제목이 달라 이 수치를 공개 공고의 감소율이라고 주장하지 않는다.
- 최종 unit 289/289, 실제 구조 위반 probe, types, lint, build, CD preparation 5 tests, CI fixture 발견 192 flows 모두 exit 0. 발견은 실행으로 보고하지 않는다.
- 실제 cmux 빌드 preview는 로컬 로그인/공고·회사·직무·빈 이미지/Enter 상세 이동/query 보존/목록 복귀/reload 6 assertions exit 0. 격리 Spring/H2 `demp_card_ui_20261007`, frontend 51017, backend 18081, backend main `13fcb24fc45fcb7f06c87d1390f6415144a05c80`의 검증된 CI JAR를 사용했다. JAR SHA256 `b3588c4ebc9e9fd310eb4aee1815f5dd63877da44a2ad7a68af6553ade854f05`.
- 서버 재시작 전의 token 만료로 로그인 화면에 이동했다. 서버 준비 전 navigation, 기존 token, validation 뒤 stale snapshot ref 실패는 준비/도구 실패이며 기능 Red가 아니다. 재 snapshot과 실제 form submit으로 다시 로그인했다. 실패 로그도 보존했다.
- 로컬 Chrome for Testing을 시작하지 않았다. development/production fixture 회귀와 교육·긴 문자열은 hosted CI가 실행하며 실제 cmux EMP 경로와 구분한다. 기존 여섯 폭의 fixture를 유지하고 thumbnail/font/읽는 순서 간격/전체 텍스트 assertions를 보강했다.

로그/명령/실제 assertion/screenshot/runtime 식별은 `/private/tmp/demp-announcement-card-density-20261007/`. helper runner `surface:1000000006`, server `surface:1000000011`, browser `surface:1000000009`, caller workspace `workspace:1000000002`를 재사용했다. 이 파일은 커밋 전 실행 기록이며 최종 PR/head CI/merge/main CI/CD 식별은 PR 설명에서 갱신한다.

빌드 preview의 여섯 폭 치수 검사도 24 assertions exit 0이다. 단일 읽기 전용 reviewer의 Critical/Important/Minor actionable finding은 0/0/0, 정확한 hosted CI 조건부 Ready to merge였다. 판단에서 제외한 192 fixture의 실제 실행과 긴 문자열/EDU 렌더링은 hosted CI에서 확인한다. 실제 preview는 빈 이미지이므로 유효 이미지의 썸네일 시각 결과는 공개 배포 화면에서 추가 확인한다. 실서비스 데이터 전반의 만족도/전환율은 이 테스트로 증명하지 않는다.

## 순차 진행 상태

이전 필터 [PR #10](https://github.com/seungmin-park/dempfrontend/pull/10)은 main `a26c416`, [main CI 37611794128](https://github.com/seungmin-park/dempfrontend/actions/runs/37611794128)의 288 unit/192 browser와 artifact identity/hash 검증, [자동 CD 37612159811](https://github.com/seungmin-park/dempfrontend/actions/runs/37612159811), 공개 cmux 흐름 12 assertions까지 완료했다.

현재 카드 전달 뒤 조회수 재현/수정 → 관리자 공고 폼(날짜 달력·시/분 입력 포함) → 질문 목록 글 구분 → 더 넓은 직무·기술 시장조사/분류·별칭·저장/검색 호환성을 진행한다. 새 요청으로 앞선 작업을 중단하지 않는다. 기존 분 단위 datetime-local은 초만 제외했으며 달력 디자인을 완료한 것으로 기록하지 않는다. 질문 목록 개선도 아직 구현하지 않았다.
