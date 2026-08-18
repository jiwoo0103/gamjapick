# GamjaPick

카드뉴스 후보를 찾고 바로 4:5 이미지 카드로 만들 수 있는 개인용 웹 도구입니다. 데이터베이스·유료 API·서버 저장 없이 JSON과 정적 배포를 사용합니다.

## 주제 수집 기준

일반 최신글이나 기사 본문은 수집하지 않습니다. 사이트가 직접 선정한 인기·공유·많이 본·이슈 목록만 제목, 원문 링크, 목록 위치, 공개된 시간·반응 지표 범위에서 저장합니다.

| 출처 | 수집 목록 |
| --- | --- |
| Dogdrip | 개드립 인기글, 유저 개드립 인기글, 읽을 거리 판 인기글 |
| 동아일보 | 실시간 인기순·공유순의 종합/경제/국제/사회 TOP 5 |
| 한국경제 | 사회·테크의 많이 본 뉴스 TOP 5 |
| 경향신문 | 지금 많이 보는 기사, 이슈 업데이트순 |
| MBC 뉴스 | 엠빅 X 14F, 많이 본 뉴스의 포털·SNS |
| Hacker News | 공식 Best Stories 상위 10개 (영문 원문 그대로) |

RSS가 제공되는 신문사도 최신 기사 피드에는 랭킹·공유·이슈 위치가 없으므로 이 용도에는 사용하지 않습니다. 경향과 MBC의 동적 목록은 사이트 화면이 실제로 사용하는 공개 JSON만 사용합니다. 로그인, CAPTCHA, 프록시, 차단 우회는 구현하지 않습니다.

## 실행

```powershell
npm install
npm run collect:check
npm run dev
```

- `npm run collect:check`: 파일을 바꾸지 않는 수집 검증
- `npm run collect`: `data/current.json`, `data/recent.json` 갱신
- `npm run test`: collector·상태·대시보드·편집기 테스트
- `npm run build`: 정적 production build

수집 결과에는 목록 단위 `collectorId`별 성공·실패와 샘플 항목이 표시됩니다. 401/403/429 또는 목록 selector 불일치는 해당 목록만 실패 처리하며 나머지 결과는 계속 저장합니다.

`data/current.json`은 현재 목록에 남아 있는 항목이고, `data/recent.json`은 최근 48시간의 고유 항목입니다. 항목은 원문 URL 기반으로 식별하며, `firstSeenAt`, `lastSeenAt`, `seenCount`, `consecutiveCount`, 반응 변화량, 최대 48개 history를 보존합니다. 같은 기사가 한 사이트의 여러 랭킹에 보이면 하나의 항목에 여러 `placements`로 합칩니다.

## 카드 편집기

`http://localhost:3000/editor`에서 1080 × 1350(4:5) 한 장 표지를 브라우저에서 편집합니다. 사진은 로컬에서만 처리되며, 제목·부제·출처의 글꼴/색상/위치·이미지 위치·그라데이션을 조절하고 PNG로 저장할 수 있습니다.

## 자동 수집과 배포

GitHub Actions는 30분마다 `npm run collect`를 실행하고 변경된 JSON만 `main`에 자동 커밋합니다. Actions 탭의 **Collect topic radar data**는 수동 실행 경로입니다. data-only 커밋은 `[CF-Pages-Skip]` 표식으로 Cloudflare Pages 재빌드를 건너뜁니다.

Cloudflare Pages는 Next.js Static HTML Export preset, production branch `main`, build command `npx next build`, output directory `out`을 사용합니다. 대시보드는 빌드 시 JSON을 fallback으로 포함하고, 브라우저에서는 GitHub `main`의 최신 JSON을 다시 읽습니다.
