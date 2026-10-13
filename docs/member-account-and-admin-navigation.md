# 마이페이지와 별도 관리자 진입 — 2026-10-13

사용자가 로그인 아이디 유지, 닉네임·비밀번호 수정을 선택했다. `/mypage`에서 본인 아이디/회원 구분을 조회하고 닉네임을 수정한다. 현재 비밀번호 확인 후 비밀번호를 변경하면 모든 이전 토큰이 만료되어 재로그인을 안내한다. 닉네임 초안은 사용자별 sessionStorage로 복구하지만 비밀번호는 저장하지 않는다.

App의 기존 `useAdminAccess`가 서버 `/api/admin/me`를 확인하고 Header의 `isAdmin` prop으로 전달한다. Header는 링크 표현만 담당하여 중복 권한 요청이 없다. 일반 회원은 마이페이지, 관리자는 별도 상단 관리자 링크로 `/admin` 운영 화면에 진입한다. 운영 화면에서 내 계정 관리로 돌아갈 수 있다. 로컬 역할을 위조하거나 이전 관리자 응답이 늦게 도착해도 메뉴를 노출하지 않는다.

## 실행 근거

- 마이페이지 Red: 빈 화면에서 사용자 공개 동작 4건 assertion 실패. 관리자 Red: 상단 링크 존재 assertion 실패.
- 모바일 Red: 실제 cmux 320px에서 메뉴 폭 약 11px/높이 63~75px 세로 줄바꿈 발견. headed 개발/배포 테스트에서도 폭 >=40px assertion 실패.
- Green: 700px 이하 상단을 기본 메뉴/계정 메뉴 두 줄로 나누고 각각 한 줄 텍스트·44px 클릭 높이를 보장한다.
- 최종 전체 `npm run verify -- --headed`: exit 0, 334 unit + 218 browser flows, typecheck/lint/build 성공. build SHA256 `9905f4439be638d550e9c4fb9d54bf0f4985babad10faf7b0b3ed5c6ddfe8e4a`.
- 실제 caller cmux workspace에서 새 JAR/H2 `:18091`과 UI `:5062`를 사용했다. 로그인 복귀→닉네임 저장→새로고침→현재 비밀번호 오류→수정→변경→새 비밀번호 재로그인→닉네임 보존. 관리자 상단 링크→운영 화면→내 계정 이동을 확인했다. fixture E2E와 실제 DB 흐름을 구분한다.
- 원본 로그/화면: `/private/tmp/demp-member-self-service`. 사용자 요청에 따라 이전 작업의 서버와 브라우저를 정리하고 보조 터미널/브라우저 하나씩만 사용한다.

상태/이름 검토: useMemberAccount는 회원 입력·요청 세대·저장 오류 복구, members API 모듈은 HTTP, MyPage는 표시·입력 이벤트를 맡는다. 기존 로그인 아이디와 작성자 표시 계약은 유지한다. nickname은 현재 마이페이지 프로필 정보이며 기존 글의 작성자 표시를 바꾸지 않는다. AppAdminAccess 및 모바일 메뉴 흐름을 필수 검증 목록에 넣었다.
