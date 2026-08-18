import assert from "node:assert/strict";
import test from "node:test";
import { finalizeTopics, runCollectors, type Collector } from "./collector";
import { parseDogdripPopularHtml, type DogdripList } from "./collectors/dogdrip";
import { parseDongaTrendHtml, type DongaList } from "./collectors/donga";
import { parseHankyungMostReadHtml, type HankyungList } from "./collectors/hankyung";
import { parseHackerNewsStories } from "./collectors/hackernews";
import { parseKhanIssueHtml, parseKhanRealtimePayload } from "./collectors/khan";
import { parseMbcOriginalPayload, parseMbcRankingPayload } from "./collectors/mbc";

test("finalizes a collector draft without changing its Korean title", () => {
  const items = finalizeTopics([{ source: "donga", sourceId: "post-1", url: "https://example.com/post-1", title: "원문 제목", summary: null, publishedAt: null, publishedAtLabel: null, metrics: { likes: null, comments: null }, placements: [{ collectorId: "donga-popular", label: "동아 인기순", rankingType: "인기순", rank: 1, category: "종합" }] }], "2026-08-19T00:00:00.000Z");
  assert.equal(items[0].id, "donga:post-1"); assert.equal(items[0].title, "원문 제목");
});
test("a failed list collector does not prevent other results", async () => {
  const collectors: Collector[] = [{ id: "donga-popular", source: "donga", async collect() { return []; } }, { id: "donga-share", source: "donga", async collect() { throw new Error("HTTP 429"); } }];
  const results = await runCollectors(collectors);
  assert.equal(results[0].status, "success"); assert.equal(results[1].status, "failed");
});

test("Dogdrip parser keeps only public popular-list rows", () => {
  const list: DogdripList = { id: "dogdrip-doc-popular", url: "https://www.dogdrip.net/doc?sort_index=popular", label: "읽을 거리 판 인기글", category: "읽을 거리" };
  const items = parseDogdripPopularHtml(`<table><tr class="ed"><td class="category">역사</td><td><a data-document-srl="719888379" href="/doc/719888379"> 제목 <span class="replyNum">9</span></a></td><td class="voted_count">10</td><td class="date">1 시간 전</td></tr></table>`, list);
  assert.equal(items.length, 1); assert.equal(items[0].sourceId, "719888379"); assert.equal(items[0].metrics.likes, 10); assert.equal(items[0].metrics.comments, 9); assert.equal(items[0].placements[0].category, "역사");
});

test("Donga parser limits each allowed ranking category to top five", () => {
  const list: DongaList = { id: "donga-popular", url: "https://www.donga.com/news/TrendNews/daily", label: "동아 실시간 인기순", rankingType: "인기순" };
  const html = `<div class="trend_ranking"><article class="news_card"><span class="num">1</span><h4 class="tit"><a href="/news/Society/article/all/20260818/134494196/2" data-ep_contentdata_content_id="134494196">종합 기사</a></h4></article></div><li class="field_news_node"><div class="field_news_head"><h4 class="tit">사회</h4></div><div class="field_news_body"><ul>${[1, 2, 3, 4, 5, 6].map((rank) => `<li><a href="/news/Society/article/all/20260818/13449419${rank}/2" data-ep_contentdata_content_id="13449419${rank}"><span class="num">${rank}</span><h5 class="tit">사회 ${rank}</h5></a></li>`).join("")}</ul></div></li><li class="field_news_node"><div class="field_news_head"><h4 class="tit">정치</h4></div></li>`;
  const items = parseDongaTrendHtml(html, list);
  assert.equal(items.length, 6); assert.deepEqual(items.map((item) => item.placements[0].rank), [1, 1, 2, 3, 4, 5]); assert.equal(items.some((item) => item.title.includes("정치")), false);
});

test("Hankyung parser reads the dedicated most-read block and converts KST", () => {
  const list: HankyungList = { id: "hankyung-tech-most-read", url: "https://www.hankyung.com/tech", category: "테크" };
  const items = parseHankyungMostReadHtml(`<div class="aside-ranking"><ol class="ranking-list"><li><em class="txt-num">1</em><h2 class="news-tit"><a href="https://www.hankyung.com/article/202608186572i">테크 인기 기사</a></h2><p class="txt-date">2026.08.18 11:00</p></li></ol></div>`, list);
  assert.equal(items.length, 1); assert.equal(items[0].publishedAt, "2026-08-18T02:00:00.000Z"); assert.equal(items[0].placements[0].rankingType, "많이 본 뉴스");
});

test("Khan collector keeps the site's public most-viewed ranking and summary", () => {
  const items = parseKhanRealtimePayload({ result: "ok", items: [{ rank: "1", art_id: "202608181029001", alt_title: "실시간 인기 기사", url: "https://www.khan.co.kr/article/202608181029001", summary: "목록 요약" }] });
  assert.equal(items.length, 1); assert.equal(items[0].placements[0].rankingType, "지금 많이 보는"); assert.equal(items[0].summary, "목록 요약");
});

test("Khan issue collector stores the issue context and its latest article only", () => {
  const items = parseKhanIssueHtml(`<ul id="recentList"><li><article><div><a href="https://www.khan.co.kr/issue/articles/ah930">미·중 정상회담</a><div class="info"><p class="number">기사 595개</p><p class="date">8시간 전</p></div></div><dl><dt><a href="https://www.khan.co.kr/article/202608182048005">대표 최신 기사</a></dt></dl></article></li></ul>`);
  assert.equal(items.length, 1); assert.equal(items[0].title, "대표 최신 기사"); assert.match(items[0].summary ?? "", /미·중 정상회담/); assert.equal(items[0].publishedAtLabel, "8시간 전");
});

test("MBC collector uses the official public portal and SNS ranking payloads", () => {
  const ranking = parseMbcRankingPayload({ Data: [{ Link: "/news/article/1234567_00000.html", Title: "포털 인기 기사" }] }, "mbc-portal", "MBC 많이 본 뉴스 · 포털");
  const original = parseMbcOriginalPayload({ Data: [{ AId: "6555082", Link: "/original/mbig/6555082_29041.html", Title: "엠빅 콘텐츠", StartDate: "2026-08-18 06:35" }] });
  assert.equal(ranking[0].placements[0].rankingType, "포털"); assert.equal(original[0].placements[0].category, "엠빅"); assert.equal(original[0].publishedAt, "2026-08-17T21:35:00.000Z");
});

test("Hacker News collector preserves the original title and available public metrics", () => {
  const items = parseHackerNewsStories([{ id: 450001, type: "story", title: "A story in English", score: 125, descendants: 24, time: 1_776_470_400 }]);
  assert.equal(items.length, 1); assert.equal(items[0].title, "A story in English"); assert.equal(items[0].url, "https://news.ycombinator.com/item?id=450001"); assert.equal(items[0].metrics.likes, 125); assert.equal(items[0].metrics.comments, 24); assert.equal(items[0].publishedAt, "2026-04-18T00:00:00.000Z");
});
