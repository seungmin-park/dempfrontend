# 공고 직무·기술·정렬 조사 — 2026-10-08

Notion 지원 현황의 25개 기록에서 공개 공고 링크를 확인하고 실제 페이지 열람을 시도했다. 지원 결과·개인 메모·지원 전략은 저장소로 복사하지 않는다. 관심/지원 철회 공고를 실제 지원 공고와 혼동하지 않는다. 조사 표본은 사용자의 지원 범위와 개발자 채용 사이트이며 국내 시장 전체의 점유율·순위를 의미하지 않는다.

## 공고에서 확인한 항목

| 공개 근거 | 관찰한 기술·직무 | 현재 상태와 한계 |
|---|---|---|
| [당근 커뮤니티 Backend 인턴](https://careers.daangn.com/jobs/role/8007747003/) | Kotlin/Java, Spring, TypeScript/React, Kafka/RabbitMQ, MySQL/Redis/BigQuery, LLM, Python/Go, GitHub Actions | 10월 18일 마감 예정 문구. 개인 메모가 아니라 공고 본문 기준 |
| [VESSL AI Junior SRE](https://jobs.ashbyhq.com/vessl-ai/30293d6c-3552-43c9-b6a4-75adfa890c40) | SRE, Linux, Python/Go, Docker/Kubernetes, Terraform/Ansible | GPU 클라우드 운영 직무. 일반 백엔드와 구분 |
| [프로엠알 신입 Backend](https://www.saramin.co.kr/zf_user/jobs/view?rec_idx=55175839) | Kotlin/Java, Spring Boot, JPA, SQL, MariaDB/AWS/Git | 본문 예정 종료일과 사이트 접수 마감 표시가 다름. 모집 중이라고 추정하지 않음 |
| [2026 넥토리얼](https://nexon-tutorial.com/) | 게임 클라이언트/서버/엔진, C++/C#, MySQL/Git | 9월 접수 종료. 지원 이력의 게임 범위를 확인하는 근거 |
| [스텝에이아이 풀스택](https://www.wanted.co.kr/wd/381607) | Python/FastAPI, PostgreSQL/Redis, Next.js/TypeScript/React, Docker, LLM | 페이지에 10월 10일 마감 표기 |
| [두잇 Backend](https://career.doeat.io/ko/o/97177) | Backend 공고 본문 확인 | 지원 이력의 Kotlin/Spring 계열과 비교. 현재 모집 여부와 경력 요건을 별도 취급 |
| [DFRN Scientific Data Engineer](https://www.wanted.co.kr/wd/381543) | Backend, 데이터 엔지니어링/분석, AI 협업 | 실제 페이지는 마감. 현재 채용 수요로 계산하지 않음 |
| [Wanted 현재 개발 목록](https://www.wanted.co.kr/wdlist/518), [Python 포지션](https://www.wanted.co.kr/wd/391243), [AI Backend](https://www.wanted.co.kr/wd/391233), [SRE/네트워크](https://www.wanted.co.kr/wd/386707) | Python/FastAPI/Django/PostgreSQL, Node.js/TypeScript, Kubernetes/Terraform | 최신 목록과 직접 상세를 함께 확인한 현재 표본 |

LG 채용 링크는 요청한 과거 상세 대신 다른 목록으로 이동했다. 쎄트렉아이 링크는 본문을 가져오지 못했고 KDB는 수집 실패했다. 슈어소프트·KT·하나·KB·IBK·우리은행·SK·APR·메타넷·LIG·현대 등은 일부 본문이 이미지/요약/목록 형태여서 공고명을 확인한 것과 세부 기술을 확인한 것을 구분한다. 읽지 못한 이미지 속 스택을 개인 메모만으로 확정하지 않는다.

## 확장 판단

기존 21개 직무에 데이터 사이언티스트/분석가, DBA, 클라우드/플랫폼 엔지니어, SRE, MLOps, 웹 퍼블리셔, 게임 엔진, AI 연구를 추가한다. 기술은 기존 6개를 보존하고 66개를 언어 / 웹 UI / 서버 프레임워크 / 모바일·게임 / 데이터 저장·메시징 / 클라우드·운영 / 데이터·AI / 개발 도구로 묶는다. 항목표는 [technologies.ts](../src/data/technologies.ts)다.

[Stack Overflow 2025 기술 조사](https://survey.stackoverflow.co/2025/technology)는 언어·DB·웹·클라우드 범위의 보조 근거이며 2026 조사라고 표시하지 않는다. [2024 조사](https://survey.stackoverflow.co/2024/technology/)의 다른 프레임워크·도구 항목은 모바일/게임/ML 범위 보완에만 사용한다. [ML 주니어](https://www.wanted.co.kr/wd/267684), [데이터 개발](https://www.wanted.co.kr/wd/231839), [Python Backend](https://www.wanted.co.kr/wd/357714)의 TensorFlow/PyTorch/Pandas, Airflow, Grafana/LangChain은 마감된 공고에서 확인한 보완 근거다. 이를 현재 채용 순위나 모집 중인 공고로 표현하지 않는다. 항목 선정과 그룹은 이 자료를 DEMP 검색에 적용한 설계 판단이다.

## 정렬

[Wanted 목록](https://www.wanted.co.kr/wdlist/518)은 최신·추천·인기, [사람인 직무 목록](https://www.saramin.co.kr/zf_user/jobs/list/job-category?cat_kewd=455)은 최신·수정·마감·지원·조회 등 정렬을 제공한다. DEMP는 저장된 데이터로 설명할 수 있는 **최신 등록순 / 마감 임박순 / 조회 많은 순**을 제공한다. 추천·지원 수·수정일을 계산할 근거는 현재 없다.

최신은 기존 ID 내림차순을 유지한다. 마감 임박은 미수동마감·미만료·마감일 있는 공고를 먼저 종료 시각 오름차순으로 정렬하고, 만료/수동 마감/마감일 미확인은 뒤로 보낸다. 목록 필터는 자동 변경하지 않는다. 조회 많은 순은 누적 조회수 내림차순이다. 모든 동률은 ID 내림차순으로 고정하여 페이지가 안정되게 한다.

## 저장·전달 계약

기존 `React` 문자열·HTTP 필드 `language`·DB `language.languages`와 `announcement.job_position`은 유지한다. ORM은 문자열 VARCHAR 매핑이다. 실제 MySQL에서도 기존 행과 신규 항목의 왕복·검색을 검증하고 native ENUM/별도 CHECK가 있는 운영 스키마는 배포 전에 확인한다. 신규 항목이 저장된 뒤 이전 enum만 아는 백엔드로 되돌리는 것은 안전한 롤백이 아니다. 새 백엔드 지원을 확인한 후 확장된 프런트를 전달한다.
