import assert from "node:assert/strict";
import test from "node:test";

import { runCollectors, type Collector } from "./collector";
import { parseDcInsideHtml } from "./collectors/dcinside";
import { parseGoogleTrendsRss } from "./collectors/google-trends";
import { parseTheQooHtml } from "./collectors/theqoo";
import { emptyMetrics } from "./parsers";

test("DCInside parser converts the KST title timestamp and reads sibling comment count", () => {
  const topics = parseDcInsideHtml(`
    <table><tr class="ub-content">
      <td class="gall_num">455192</td>
      <td class="gall_tit"><a href="/board/view/?id=dcbest&no=455192">실시간 베스트 글</a><a class="reply_numbox"><span class="reply_num">[69]</span></a></td>
      <td class="gall_date" title="2026-08-19 00:55:01">00:55</td>
      <td class="gall_count">1,653</td><td class="gall_recommend">3</td>
    </tr></table>
  `);

  assert.equal(topics[0].publishedAtLabel, "2026-08-19 00:55:01");
  assert.equal(topics[0].publishedAt, "2026-08-18T15:55:01.000Z");
  assert.equal(topics[0].metrics.comments, 69);
  assert.equal(topics[0].title, "실시간 베스트 글");
});

test("TheQoo parser keeps only post links, parses comments, and resolves today's time in KST", () => {
  const topics = parseTheQooHtml(`
    <table>
      <tr class="notice"><td><a href="/hot/123">공지</a></td></tr>
      <tr><td><a href="/hot/category/24788">이슈</a></td></tr>
      <tr>
        <td class="title"><a href="/hot/456">실제 인기 글</a><a class="replyNum" href="/hot/456#456_comment">12</a></td>
        <td class="time">00:12</td><td class="m_no">1,234</td>
      </tr>
    </table>
  `, new Date("2026-08-18T15:47:00.000Z"));

  assert.deepEqual(topics.map((topic) => topic.sourceId), ["456"]);
  assert.equal(topics[0].metrics.comments, 12);
  assert.equal(topics[0].metrics.views, 1_234);
  assert.equal(topics[0].publishedAt, "2026-08-18T15:12:00.000Z");
});

test("Google Trends parser preserves article URL and public search volume", () => {
  const topics = parseGoogleTrendsRss(`
    <rss xmlns:ht="https://trends.google.com/trending/rss"><channel><item>
      <title>테스트 검색어</title>
      <ht:approx_traffic>20,000+</ht:approx_traffic>
      <pubDate>Tue, 18 Aug 2026 07:00:00 -0700</pubDate>
      <ht:news_item><ht:news_item_url>https://example.com/article/42</ht:news_item_url></ht:news_item>
    </item></channel></rss>
  `);

  assert.equal(topics[0].url, "https://example.com/article/42");
  assert.equal(topics[0].metrics.searchVolume, 20_000);
  assert.equal(topics[0].publishedAt, "2026-08-18T14:00:00.000Z");
});

test("a failed collector does not prevent other results", async () => {
  const collectors: Collector[] = [
    {
      source: "dcinside",
      async collect() {
        return [{
          source: "dcinside",
          sourceId: "1",
          url: "https://example.com/1",
          title: "정상 항목",
          titleOriginal: null,
          publishedAt: null,
          publishedAtLabel: null,
          metrics: emptyMetrics(),
        }];
      },
    },
    {
      source: "reddit",
      async collect() {
        throw new Error("HTTP 429");
      },
    },
  ];

  const results = await runCollectors(collectors);
  assert.equal(results[0].status, "success");
  assert.equal(results[1].status, "failed");
});
