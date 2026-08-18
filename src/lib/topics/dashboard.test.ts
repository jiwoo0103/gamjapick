import assert from "node:assert/strict";
import test from "node:test";

import { filterAndSortTopics } from "./dashboard";
import type { TopicRecord } from "./types";

function topic(
  id: string,
  source: TopicRecord["source"],
  lastSeenAt: string,
  deltaViews: number | null,
  consecutiveCount = 1,
  delta: Partial<TopicRecord["delta"]> = {},
): TopicRecord {
  return {
    id: `${source}:${id}`,
    source,
    sourceId: id,
    url: `https://example.com/${id}`,
    title: id,
    titleOriginal: null,
    titleKo: null,
    publishedAt: null,
    publishedAtLabel: null,
    metrics: { views: null, likes: null, comments: null, searchVolume: null },
    collectedAt: lastSeenAt,
    firstSeenAt: lastSeenAt,
    lastSeenAt,
    seenCount: consecutiveCount,
    consecutiveCount,
    isCurrent: true,
    delta: { views: deltaViews, likes: null, comments: null, searchVolume: null, ...delta },
    history: [],
  };
}

test("filters topics by source", () => {
  const topics = [
    topic("one", "dcinside", "2026-08-19T00:00:00.000Z", 3),
    topic("two", "reddit", "2026-08-19T01:00:00.000Z", 8),
  ];

  assert.deepEqual(filterAndSortTopics(topics, "reddit", "recent").map((item) => item.id), ["reddit:two"]);
});

test("places missing metric deltas after available values", () => {
  const topics = [
    topic("missing", "dcinside", "2026-08-19T02:00:00.000Z", null),
    topic("higher", "dcinside", "2026-08-19T00:00:00.000Z", 8),
    topic("lower", "dcinside", "2026-08-19T01:00:00.000Z", 3),
  ];

  assert.deepEqual(filterAndSortTopics(topics, "all", "views").map((item) => item.id), [
    "dcinside:higher",
    "dcinside:lower",
    "dcinside:missing",
  ]);
});

test("sorts by every dashboard metric and uses recent discovery as the tie breaker", () => {
  const topics = [
    topic("older", "dcinside", "2026-08-19T00:00:00.000Z", 2, 2, { likes: 2, comments: 4 }),
    topic("newer", "dcinside", "2026-08-19T01:00:00.000Z", 1, 5, { likes: 7, comments: 3 }),
  ];

  assert.equal(filterAndSortTopics(topics, "all", "recent")[0].id, "dcinside:newer");
  assert.equal(filterAndSortTopics(topics, "all", "consecutive")[0].id, "dcinside:newer");
  assert.equal(filterAndSortTopics(topics, "all", "likes")[0].id, "dcinside:newer");
  assert.equal(filterAndSortTopics(topics, "all", "comments")[0].id, "dcinside:older");
});
