import assert from "node:assert/strict";
import test from "node:test";
import { bestRank, filterAndSortTopics } from "./dashboard";
import type { TopicRecord } from "./types";

function topic(id: string, source: TopicRecord["source"], rank: number | null, lastSeenAt: string, likes: number | null = null): TopicRecord {
  return { id: `${source}:${id}`, source, sourceId: id, url: `https://example.com/${id}`, title: id, summary: null, publishedAt: null, publishedAtLabel: null, metrics: { likes: null, comments: null }, placements: [{ collectorId: `${source}-feed`, label: "목록", rankingType: "인기", rank, category: null }], collectedAt: lastSeenAt, firstSeenAt: lastSeenAt, lastSeenAt, seenCount: 1, consecutiveCount: 1, isCurrent: true, delta: { likes, comments: null }, history: [] };
}

test("filters new collector sources", () => {
  const topics = [topic("one", "donga", 1, "2026-08-19T00:00:00.000Z"), topic("two", "mbc", 2, "2026-08-19T01:00:00.000Z")];
  assert.deepEqual(filterAndSortTopics(topics, "mbc", "recent").map((item) => item.id), ["mbc:two"]);
});
test("sorts by the best available rank and puts missing ranks last", () => {
  const topics = [topic("missing", "donga", null, "2026-08-19T02:00:00.000Z"), topic("second", "donga", 2, "2026-08-19T01:00:00.000Z"), topic("first", "donga", 1, "2026-08-19T00:00:00.000Z")];
  assert.deepEqual(filterAndSortTopics(topics, "all", "rank").map((item) => item.id), ["donga:first", "donga:second", "donga:missing"]);
  assert.equal(bestRank(topics[0]), null);
});
test("keeps reaction-delta sorting for sources that expose it", () => {
  const topics = [topic("low", "dogdrip", null, "2026-08-19T00:00:00.000Z", 1), topic("high", "dogdrip", null, "2026-08-19T01:00:00.000Z", 4)];
  assert.deepEqual(filterAndSortTopics(topics, "all", "likes").map((item) => item.id), ["dogdrip:high", "dogdrip:low"]);
});
