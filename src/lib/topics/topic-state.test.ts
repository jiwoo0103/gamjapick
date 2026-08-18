import assert from "node:assert/strict";
import test from "node:test";
import { mergeTopicState } from "./state";
import type { CollectedTopic, CollectorResult } from "./types";

const start = "2026-08-19T00:00:00.000Z";
function topic(id: string, likes: number | null, collectorId = "donga-popular"): CollectedTopic {
  return { id: `donga:${id}`, source: "donga", sourceId: id, url: `https://example.com/${id}`, title: `항목 ${id}`, summary: null, publishedAt: null, publishedAtLabel: null, metrics: { likes, comments: null }, placements: [{ collectorId, label: "동아 인기순", rankingType: "인기순", rank: 1, category: "종합" }], collectedAt: start };
}
function success(items: CollectedTopic[], collectorId = "donga-popular"): CollectorResult { return { collectorId, source: "donga", status: "success", collectedAt: start, items }; }

test("tracks first and consecutive appearances with metric deltas", () => {
  const first = mergeTopicState([], [success([topic("1", 10)])], start);
  const second = mergeTopicState(first.recent, [success([topic("1", 17)])], "2026-08-19T00:30:00.000Z");
  assert.equal(second.recent[0].firstSeenAt, start); assert.equal(second.recent[0].seenCount, 2); assert.equal(second.recent[0].consecutiveCount, 2); assert.equal(second.recent[0].delta.likes, 7); assert.equal(second.recent[0].history.length, 2);
});
test("marks a missing successful list item as non-current and resets it when it returns", () => {
  const first = mergeTopicState([], [success([topic("1", 10)])], start);
  const missing = mergeTopicState(first.recent, [success([])], "2026-08-19T00:30:00.000Z");
  const returned = mergeTopicState(missing.recent, [success([topic("1", 15)])], "2026-08-19T01:00:00.000Z");
  assert.equal(missing.recent[0].isCurrent, false); assert.equal(missing.recent[0].consecutiveCount, 0); assert.equal(returned.recent[0].seenCount, 2); assert.equal(returned.recent[0].consecutiveCount, 1);
});
test("keeps an item current when another independently collected list fails", () => {
  const first = mergeTopicState([], [success([topic("1", 10)])], start);
  const failed: CollectorResult = { collectorId: "donga-share", source: "donga", status: "failed", collectedAt: "2026-08-19T00:30:00.000Z", error: "HTTP 429" };
  assert.equal(mergeTopicState(first.recent, [failed], "2026-08-19T00:30:00.000Z").current[0].id, "donga:1");
});
test("merges placements for the same source URL", () => {
  const popular = topic("1", null, "donga-popular");
  const shared = { ...topic("1", null, "donga-share"), placements: [{ collectorId: "donga-share", label: "동아 공유순", rankingType: "공유순", rank: 2, category: "사회" }] };
  const state = mergeTopicState([], [success([popular]), success([shared], "donga-share")], start);
  assert.equal(state.current.length, 1); assert.deepEqual(state.current[0].placements.map((placement) => placement.collectorId), ["donga-popular", "donga-share"]);
});
test("expires records not seen for 48 hours and keeps only 48 snapshots", () => {
  let recent = mergeTopicState([], [success([topic("1", 1)])], start).recent;
  for (let count = 2; count <= 49; count += 1) recent = mergeTopicState(recent, [success([topic("1", count)])], new Date(Date.parse(start) + (count - 1) * 30 * 60 * 1_000).toISOString()).recent;
  assert.equal(recent[0].history.length, 48); assert.equal(recent[0].history[0].metrics.likes, 2);
  assert.equal(mergeTopicState(recent, [success([])], "2026-08-22T00:01:00.000Z").recent.length, 0);
});
