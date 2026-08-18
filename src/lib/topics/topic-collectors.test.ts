import assert from "node:assert/strict";
import test from "node:test";

import { runCollectors, type Collector } from "./collector";
import { parseGoogleTrendsRss } from "./collectors/google-trends";
import { parseTheQooHtml } from "./collectors/theqoo";
import { emptyMetrics } from "./parsers";

test("TheQoo parser ignores categories and notices", () => {
  const topics = parseTheQooHtml(`
    <table>
      <tr class="notice"><td><a href="/hot/123">공지</a></td></tr>
      <tr><td><a href="/hot/category/24788">이슈</a></td></tr>
      <tr><td><a href="/hot/456">실제 인기 글</a></td></tr>
    </table>
  `);

  assert.deepEqual(topics.map((topic) => topic.sourceId), ["456"]);
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
