import assert from "node:assert/strict";
import test from "node:test";

import { mergeTopicState } from "./state";
import type { CollectedTopic, CollectorResult, TopicMetrics } from "./types";

const start = "2026-08-19T00:00:00.000Z";

function metrics(views: number | null): TopicMetrics {
  return { views, likes: null, comments: null, searchVolume: null };
}

function topic(id: string, views: number | null): CollectedTopic {
  return {
    id: `dcinside:${id}`,
    source: "dcinside",
    sourceId: id,
    url: `https://example.com/${id}`,
    title: `항목 ${id}`,
    titleOriginal: null,
    titleKo: null,
    publishedAt: null,
    publishedAtLabel: null,
    metrics: metrics(views),
    collectedAt: start,
  };
}

function success(items: CollectedTopic[]): CollectorResult {
  return { source: "dcinside", status: "success", collectedAt: start, items };
}

test("tracks first and consecutive appearances with metric deltas", () => {
  const first = mergeTopicState([], [success([topic("1", 10)])], start);
  const second = mergeTopicState(first.recent, [success([topic("1", 17)])], "2026-08-19T00:30:00.000Z");

  assert.equal(second.recent[0].firstSeenAt, start);
  assert.equal(second.recent[0].seenCount, 2);
  assert.equal(second.recent[0].consecutiveCount, 2);
  assert.equal(second.recent[0].delta.views, 7);
  assert.equal(second.recent[0].history.length, 2);
});

test("marks a missing item as non-current and resets it when it returns", () => {
  const first = mergeTopicState([], [success([topic("1", 10)])], start);
  const missing = mergeTopicState(first.recent, [success([])], "2026-08-19T00:30:00.000Z");
  const returned = mergeTopicState(missing.recent, [success([topic("1", 15)])], "2026-08-19T01:00:00.000Z");

  assert.equal(missing.recent[0].isCurrent, false);
  assert.equal(missing.recent[0].consecutiveCount, 0);
  assert.equal(returned.recent[0].seenCount, 2);
  assert.equal(returned.recent[0].consecutiveCount, 1);
});

test("expires records not seen for 48 hours", () => {
  const first = mergeTopicState([], [success([topic("1", 10)])], start);
  const expired = mergeTopicState(first.recent, [success([])], "2026-08-21T00:01:00.000Z");

  assert.equal(expired.recent.length, 0);
  assert.equal(expired.current.length, 0);
});

test("keeps only the latest 48 metric snapshots", () => {
  let recent = mergeTopicState([], [success([topic("1", 1)])], start).recent;
  for (let count = 2; count <= 49; count += 1) {
    const collectedAt = new Date(Date.parse(start) + (count - 1) * 30 * 60 * 1_000).toISOString();
    recent = mergeTopicState(recent, [success([topic("1", count)])], collectedAt).recent;
  }

  assert.equal(recent[0].history.length, 48);
  assert.equal(recent[0].history[0].metrics.views, 2);
  assert.equal(recent[0].history.at(-1)?.metrics.views, 49);
});

test("keeps prior current items when that source collector fails", () => {
  const first = mergeTopicState([], [success([topic("1", 10)])], start);
  const failed: CollectorResult = { source: "dcinside", status: "failed", collectedAt: "2026-08-19T00:30:00.000Z", error: "HTTP 429" };
  const next = mergeTopicState(first.recent, [failed], "2026-08-19T00:30:00.000Z");

  assert.equal(next.current[0].id, "dcinside:1");
  assert.equal(next.current[0].consecutiveCount, 1);
});
