# AGENTS.md

## Project Overview

- Product: `GamjaPick` — 국내외 커뮤니티·뉴스·트렌드에서 카드뉴스 주제 후보를 수집하고, 선택한 이미지와 문구를 카드뉴스 템플릿에 자동 배치·편집할 수 있는 개인용 웹 도구
- Repository / folder name: `gamjapick`
- Primary branch: `main`
- Package manager: `npm`
- Frontend: Next.js App Router, TypeScript, React, Tailwind CSS
- Topic collection: TypeScript 기반 collector + GitHub Actions
- Translation: 해외 제목은 무료 로컬 번역 도구를 우선 사용하며, 현재 계획은 Argos Translate
- Storage: 데이터베이스 없이 JSON 파일 기반
- Hosting: 정적 배포를 우선하며, 서버·유료 인프라는 필요해질 때만 추가
- Cost policy: 초기 운영 비용 0원을 기본 원칙으로 한다

## Product Scope

GamjaPick의 큰 개발 단계는 두 단계다.

### Stage 1 — Topic Radar

국내외 인기·급상승 주제 후보를 자동 수집하고 대시보드에서 확인하는 기능을 만든다.

초기 대상 소스:

- DCInside 실시간 베스트
- FMKorea 포텐
- TheQoo HOT
- Reddit `r/nottheonion`
- NDTV Offbeat
- Google Trends KR

핵심 요구사항:

- 30분 주기 수집
- 데이터베이스 사용 금지
- 수집 단계에서 생성형 AI 사용 금지
- 유료 API 사용 금지
- 각 collector는 서로 독립적으로 실패할 수 있어야 하며, 한 소스의 실패가 전체 수집 실패로 이어지지 않아야 한다
- `current.json`에는 최신 인기 목록을 저장한다
- `recent.json`에는 최근 48시간 동안 발견된 고유 항목을 저장한다
- 항목별 `firstSeenAt`, `lastSeenAt`, `seenCount`, `consecutiveCount`, 현재 반응 지표와 변화량을 추적한다
- 지표 history는 최대 48개 snapshot을 유지한다
- 해외 제목은 원문과 한국어 번역을 함께 보존한다
- 값이 제공되지 않는 반응 지표는 추측하지 않고 `null`로 저장한다

### Stage 2 — Card Editor

사용자가 사진과 문구를 입력하면 정해진 카드뉴스 템플릿에 자동 배치하고, 이후 직접 수정할 수 있는 편집기를 만든다.

초기 목표:

- 4:5 카드뉴스 표지 템플릿
- 이미지 업로드
- 제목 입력
- 자동 줄바꿈 및 기본 폰트 크기 조정
- 폰트 선택
- 글자 크기·굵기·줄간격·정렬 조절
- 텍스트 위치 조절
- 이미지 확대·축소·이동
- 하단 그라데이션 조절
- PNG 내보내기
- 가능하면 편집 과정은 브라우저에서 처리하고 서버 저장을 요구하지 않는다

Stage 1이 안정적으로 동작하기 전에는 Stage 2 구현을 섞지 않는다. 사용자가 명시적으로 순서 변경을 요청한 경우에만 예외로 한다.

## Session Start

작업을 시작할 때 아래 순서로 확인한다.

1. `git status --short --branch`와 최근 커밋을 확인한다.
2. 이 파일을 읽는다.
3. 존재한다면 `PROJECT_STATUS.md`, `ROADMAP.md`, `docs/ARCHITECTURE.md`를 읽는다.
4. 요청을 Stage 1, Stage 2, 공통 인프라, 문서 작업 중 하나로 분류한다.
5. 현재 요청에 필요한 엔트리 포인트, 직접 의존 파일, 관련 테스트만 추가로 읽는다.
6. 저장소 전체를 기본적으로 읽지 않는다.
7. Markdown 문서의 주장만 믿지 말고 실제 코드, 테스트, workflow, 설정 파일로 구현 사실을 재확인한다.
8. 사용자가 만든 기존 변경이나 관련 없는 작업 중인 변경은 수정하거나 되돌리지 않는다.

아직 존재하지 않는 문서나 명령은 존재한다고 가정하지 않는다.

## Change Consent

사용자가 명시적으로 구현, 수정, 추가, 제거, 적용, 생성, 고침(fix)을 요청했을 때만 저장소 파일을 변경한다.

다음과 같은 요청은 기본적으로 읽기 전용 작업으로 처리한다.

- 조사
- 리뷰
- 설명
- 진단
- 비교
- 평가
- 계획
- 제안
- 원인 분석
- "왜 이래?"
- "이거 괜찮아?"
- "어떻게 하는 게 좋음?"
- "확인해봐"

읽기 전용 요청에서는 안전한 조회·테스트·분석만 수행하고 변경안을 제안하되 실제 파일은 수정하지 않는다.

사용자의 의도가 불명확하면 구현 전에 확인한다.

한 번 명확한 구현 요청을 받았더라도 요청 범위를 넘어서는 추가 기능, 리팩터링, 배포, 외부 상태 변경까지 자동으로 승인된 것으로 간주하지 않는다.

## Source of Truth

- 실제 사용자 화면 동작: 코드와 UI/E2E 테스트
- collector 동작: collector 코드, 실제 샘플 실행 결과, 관련 테스트
- 수집 스케줄: GitHub Actions workflow
- 데이터 계약: 타입 정의, JSON schema 또는 관련 테스트
- 현재 작업 상태: `PROJECT_STATUS.md`가 존재하면 해당 문서
- 개발 계획: `ROADMAP.md`가 존재하면 해당 문서
- 아키텍처: `docs/ARCHITECTURE.md`가 존재하면 참고하되 실제 코드로 확인
- 과거 결정: `docs/WORK_LOG.md`가 존재하면 해당 문서

문서는 안내와 의사결정 기록 역할을 하며, 구현 사실은 코드와 설정으로 재확인한다.

## High-Risk Change Approval

되돌리기 어렵거나 영향 범위가 큰 작업은 반드시 사용자에게 먼저 설명하고 명시적 승인을 받은 뒤 실행한다.

다음 작업은 항상 사전 승인이 필요하다.

- 프로덕션 배포 또는 공개 사이트 상태를 바꾸는 작업
- GitHub Pages, GitHub Actions, 저장소 설정, 권한 등 외부 동작에 영향을 주는 변경
- GitHub Actions의 수집 주기를 크게 높이거나 외부 요청량을 크게 늘리는 변경
- 새로운 유료 서비스, 유료 API, 과금 가능한 리소스를 생성하거나 활성화하는 작업
- 시크릿, 토큰, API 키, OAuth credential의 생성·변경·회전·삭제·출력
- 외부 서비스에 데이터를 쓰거나 삭제하는 작업
- 대량 외부 요청, backfill, 반복 테스트 등 외부 서비스의 쿼터·트래픽에 큰 영향을 줄 수 있는 작업
- 많은 파일을 한꺼번에 수정·이동·삭제하는 작업
- `rm -rf`, `Remove-Item -Recurse`, `git clean` 등 광범위한 삭제
- `git reset --hard`
- `git push --force`
- history-rewriting rebase
- 원격 브랜치·태그 삭제
- 원격 Git 히스토리 변경
- PATH, PowerShell execution policy, 글로벌 npm/Python 패키지, Git global config 등 시스템·사용자 전역 설정 변경
- 프로젝트 폴더 밖의 파일을 변경하는 작업
- 되돌리기 어렵거나 복구 방법이 불분명한 작업

목록에 없더라도 blast radius가 크거나 외부 상태를 변경하거나 복구 비용이 큰 작업이면 실행 전에 승인을 받는다.

승인 요청에는 다음을 포함한다.

- 실행하려는 명령 또는 작업
- 영향을 받는 파일·서비스·저장소
- 외부 상태 변경 여부
- 비용·쿼터·트래픽 영향 여부
- 예상 위험
- 롤백 방법 또는 완전한 롤백이 불가능하다는 설명

일반적인 저장소 내부 코드 수정, 파일 읽기, 테스트, lint, typecheck, build, `git status`, `git diff`, `git log` 등은 구현 요청 범위 안에서 별도 고위험 승인을 요구하지 않는다.

커밋, 푸시, PR 생성은 사용자가 요청한 경우에만 수행한다.

## Collector Safety Rules

외부 사이트 수집 코드는 다음 원칙을 지킨다.

- 공식 API 또는 공식 RSS가 안정적으로 제공되면 HTML scraping보다 우선한다.
- 사이트의 공개적으로 접근 가능한 데이터만 수집한다.
- 로그인 우회, CAPTCHA 우회, anti-bot 우회, 프록시 회전, 차단 회피를 구현하지 않는다.
- 401, 403, 429 또는 명확한 차단 신호가 반복되면 우회하지 않고 해당 collector를 실패 처리하고 원인을 보고한다.
- 사이트별 요청 빈도를 필요 이상으로 높이지 않는다.
- 재시도는 제한된 횟수와 backoff를 사용한다.
- 하나의 collector 실패가 전체 실행을 중단시키지 않도록 격리한다.
- HTML selector는 실제 현재 DOM을 확인한 뒤 작성한다.
- 수집 대상 사이트의 구조가 바뀌었을 가능성을 고려하고, selector 실패를 데이터 없음으로 조용히 숨기지 않는다.
- 수집 가능한 지표만 저장하며 존재하지 않는 조회수·추천수·댓글수 등을 추정하지 않는다.
- 원문 URL과 source 식별자를 보존한다.
- 커뮤니티 게시물은 사실 확인이 끝난 뉴스로 취급하지 않는다.
- 생성형 AI를 Stage 1의 수집·랭킹·필터링 과정에 임의로 추가하지 않는다.
- 유료 API 또는 비용이 발생할 수 있는 외부 서비스를 임의로 추가하지 않는다.

## Data Rules

Stage 1 데이터는 데이터베이스 없이 파일 기반으로 관리한다.

기본 상태 파일:

- `data/current.json`: 가장 최근 수집에서 현재 인기 목록에 존재하는 항목
- `data/recent.json`: 최근 48시간 동안 발견된 고유 항목

항목 식별자는 가능한 한 source와 원문 고유 ID를 조합해 안정적으로 만든다. 원문 고유 ID가 없는 경우 URL의 안정적인 부분을 사용하되, 제목만으로 식별하지 않는다.

기본 필드의 의미:

- `firstSeenAt`: 시스템이 처음 발견한 시각
- `lastSeenAt`: 시스템이 마지막으로 확인한 시각
- `seenCount`: 인기 목록에서 총 몇 번 포착됐는지
- `consecutiveCount`: 연속 수집에서 몇 번 포착됐는지
- `isCurrent`: 최신 수집의 인기 목록에 존재하는지
- `metrics`: 최신 반응 지표
- `delta`: 직전 관측값과 비교한 변화량
- `history`: 관측 시점별 지표 기록, 최대 48개

항목이 최신 목록에서 사라지면 `isCurrent=false`, `consecutiveCount=0`으로 처리한다. 이후 다시 등장하면 `seenCount`는 계속 누적하고 `consecutiveCount`는 1부터 다시 시작한다.

최근 48시간을 벗어난 항목은 `recent.json`에서 제거한다.

해외 항목은 가능한 경우 다음을 함께 보존한다.

- `titleOriginal`
- `titleKo`

번역 실패 시 원문을 삭제하거나 덮어쓰지 않는다.

데이터 정리·병합 로직은 source별 collector와 분리한다.

## Editor Rules

Stage 2 편집기는 카드뉴스 제작에 필요한 기능에 집중하고 범용 디자인 툴로 확장하지 않는다.

초기 구현 원칙:

- 4:5 표지 제작을 우선한다.
- 사용자가 업로드한 이미지와 입력한 문구를 템플릿에 자동 배치한다.
- 자동 배치 후 반드시 사용자가 직접 수정할 수 있어야 한다.
- 텍스트는 이미지 생성 모델로 그리지 않고 브라우저에서 실제 문자로 렌더링한다.
- 폰트, 글자 크기, 굵기, 줄간격, 정렬, 위치를 수정할 수 있게 설계한다.
- 이미지 확대·축소·이동을 지원한다.
- 최종 결과를 PNG로 내보낼 수 있게 한다.
- 초기 버전에서는 서버 이미지 저장, 사용자 계정, DB를 요구하지 않는다.
- 범용 Canva 수준의 자유 편집 기능은 사용자가 명시적으로 요청하지 않는 한 추가하지 않는다.
- 생성형 이미지·텍스트 API 연동은 사용자가 명시적으로 요청하기 전까지 추가하지 않는다.

## Implementation Rules

- 요청 범위를 넘는 리팩터링을 하지 않는다.
- 기존의 관련 없는 변경은 보존한다.
- 가장 단순한 구조로 요구사항을 만족시키는 구현을 우선한다.
- 미래에 필요할 것이라는 이유만으로 서버, DB, 인증, 큐, Worker, 캐시 계층 등을 선제적으로 추가하지 않는다.
- 새 동작에는 적절한 테스트를 추가하거나 기존 테스트를 갱신한다.
- collector는 source별 파일로 분리하고 공통 정규화·병합 로직과 결합도를 낮춘다.
- 반복되는 데이터 계약은 공통 타입으로 관리한다.
- UI와 수집 로직을 직접 결합하지 않는다.
- Next.js 페이지 렌더링이 collector 실행을 트리거하지 않도록 한다.
- 스케줄 수집은 별도 script/workflow에서 실행한다.
- 시크릿은 소스, 로그, 문서, 채팅에 출력하지 않는다.
- 파일 검색은 가능하면 `rg`를 우선 사용한다.
- 파일 수정은 가능하면 작은 patch 단위로 수행한다.
- 사용하지 않는 dependency를 추가하지 않는다.
- 새 dependency를 추가할 때는 왜 필요한지 설명할 수 있어야 한다.
- 기존 패키지나 framework 버전을 기억에 의존해 가정하지 말고 실제 `package.json`과 lockfile을 확인한다.

## Next.js Rules

Next.js 관련 코드를 작성하기 전에 저장소에 설치된 실제 Next.js 버전을 확인한다.

- 설치된 버전의 API와 현재 프로젝트 구조를 기준으로 구현한다.
- 학습 데이터에 기반한 예전 Next.js 관례를 현재 프로젝트에 그대로 적용하지 않는다.
- 로컬에 해당 버전의 공식 문서가 제공되는 경우 이를 우선 확인한다.
- deprecated API 경고를 무시하지 않는다.
- 정적 배포를 유지하는 동안 서버 전용 기능을 불필요하게 추가하지 않는다.

## Verification

변경 후에는 변경 영역에 가장 가까운 검증부터 실행한다.

기본 원칙:

- collector 변경: 해당 collector를 실제 실행해 항목 수, 제목, URL, 시간, 제공되는 지표를 샘플 검증한다.
- 공통 데이터 로직 변경: 관련 단위 테스트를 실행한다.
- 상태 병합 로직 변경: 최소한 다음 케이스를 검증한다.
  - 최초 등장
  - 연속 등장
  - 목록에서 사라짐
  - 재등장
  - 48시간 만료
  - history 49번째 추가 시 48개 유지
  - delta 계산
- 번역 변경: 원문 보존과 번역 실패 fallback을 확인한다.
- UI 변경: lint, typecheck, build와 해당 UI의 최소 동작 확인을 수행한다.
- Editor 변경: 자동 배치, 수동 수정, PNG export의 영향을 받는 범위를 확인한다.
- workflow 변경: YAML 문법과 실행 조건을 확인하고 가능한 경우 수동 실행 가능한 경로를 유지한다.
- 문서만 변경한 경우 `git diff --check`를 실행한다.

프로젝트에 존재하지 않는 `npm` script나 검증 명령을 임의로 가정하지 않는다.

검증하지 못한 항목은 이유와 예상 영향을 최종 응답에 명시한다.

## Git Workflow

- 관련 파일만 스테이징한다.
- 사용자의 다른 변경을 commit에 포함하지 않는다.
- commit 메시지는 변경 의도를 간결하게 표현한다.
- destructive Git 명령을 사용하지 않는다.
- 커밋, push, PR 생성은 사용자가 요청한 경우에만 수행한다.
- push 전에는 관련 문서가 현재 코드와 일치하는지 확인한다.
- 자동 생성 데이터 파일을 commit할지 여부는 프로젝트의 확정된 운영 방식을 따른다. 아직 정해지지 않았다면 임의로 결정하지 않는다.

## Documentation

프로젝트가 성장하면 아래 문서를 기준으로 관리한다.

- `PROJECT_STATUS.md`: 현재 구현 상태, 정상 동작 여부, 미해결 이슈, 다음 작업
- `ROADMAP.md`: Stage 1 / Stage 2 진행 순서와 완료 기준
- `docs/ARCHITECTURE.md`: 주요 구성요소, 책임, 데이터 흐름
- `docs/PRODUCT_SPEC.md`: 사용자 기능과 화면 계약
- `docs/WORK_LOG.md`: 완료 작업과 중요한 결정
- `docs/runbooks/`: GitHub Actions, 배포, 번역 모델, 운영 절차 등 반복 가능한 운영 지침

아직 필요하지 않은 문서는 단지 형식을 맞추기 위해 만들지 않는다.

다음이 바뀌면 관련 문서도 함께 갱신한다.

- 기능 범위 또는 완료 상태
- collector source 또는 데이터 계약
- 30분 수집 workflow
- 배포 방식
- editor의 사용자 동작
- 운영 명령 또는 필요한 외부 설정
- 중요한 기술적 결정

## Cost and Simplicity Policy

GamjaPick의 초기 목표는 비용 없이 개인적으로 사용할 수 있는 자동화 도구다.

따라서 사용자가 별도로 승인하지 않는 한:

- 데이터베이스를 도입하지 않는다.
- 유료 API를 도입하지 않는다.
- 별도 서버를 운영하지 않는다.
- 불필요한 SaaS를 추가하지 않는다.
- 과도한 인프라를 선제적으로 설계하지 않는다.
- 무료·정적·로컬 처리로 해결 가능한 문제는 그 방식을 우선한다.

무료 방식이 요구사항을 충족하지 못하게 된 시점에만 대안을 제안하고, 비용·복잡도·장단점을 설명한 뒤 사용자의 결정을 받는다.

## Final Response

최종 응답은 길게 작업 일지를 반복하지 말고 다음을 간결히 정리한다.

- 무엇을 변경했는지
- 어떤 검증을 실행했고 무엇이 통과했는지
- 커밋·푸시·배포·외부 상태 변경 여부
- 실패하거나 검증하지 못한 항목
- 남은 위험 또는 다음 작업이 필요한 경우 그 내용

사용자가 단순 설명이나 조사만 요청한 경우에는 변경했다고 표현하지 않는다.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
