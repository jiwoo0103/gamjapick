import type { CollectedTopic, CollectorResult, TopicMetricDelta, TopicMetricSnapshot, TopicMetrics, TopicPlacement, TopicRecord } from "./types";

const HISTORY_LIMIT = 48;
const RECENT_WINDOW_MS = 48 * 60 * 60 * 1_000;

export type MergedTopicState = { current: TopicRecord[]; recent: TopicRecord[] };

export function mergeTopicState(previousRecent: TopicRecord[], results: CollectorResult[], collectedAt: string): MergedTopicState {
  const previouslyCurrentIds = new Set(previousRecent.filter((record) => record.isCurrent).map((record) => record.id));
  const previousConsecutiveCounts = new Map(previousRecent.map((record) => [record.id, record.consecutiveCount]));
  const successfulCollectorIds = new Set(results.filter((result) => result.status === "success").map((result) => result.collectorId));
  const collectedTopics = new Map<string, CollectedTopic>();
  for (const result of results) {
    if (result.status !== "success") continue;
    for (const topic of result.items) {
      const existing = collectedTopics.get(topic.id);
      collectedTopics.set(topic.id, existing ? combineCollectedTopics(existing, topic) : topic);
    }
  }

  const records = new Map(previousRecent.map((record) => [record.id, record]));
  for (const [id, record] of records) {
    const retainedPlacements = record.placements.filter((placement) => !successfulCollectorIds.has(placement.collectorId));
    if (retainedPlacements.length !== record.placements.length) {
      records.set(id, { ...record, placements: retainedPlacements, isCurrent: retainedPlacements.length > 0, consecutiveCount: retainedPlacements.length > 0 ? record.consecutiveCount : 0 });
    }
  }
  for (const topic of collectedTopics.values()) records.set(topic.id, mergeTopicRecord(records.get(topic.id), topic, collectedAt, previouslyCurrentIds.has(topic.id), previousConsecutiveCounts.get(topic.id) ?? 0));

  const cutoff = Date.parse(collectedAt) - RECENT_WINDOW_MS;
  const recent = [...records.values()].filter((record) => Date.parse(record.lastSeenAt) >= cutoff).sort((left, right) => Date.parse(right.lastSeenAt) - Date.parse(left.lastSeenAt));
  return { current: recent.filter((record) => record.isCurrent), recent };
}

function combineCollectedTopics(left: CollectedTopic, right: CollectedTopic): CollectedTopic {
  return {
    ...left,
    summary: left.summary ?? right.summary,
    publishedAt: left.publishedAt ?? right.publishedAt,
    publishedAtLabel: left.publishedAtLabel ?? right.publishedAtLabel,
    metrics: { likes: left.metrics.likes ?? right.metrics.likes, comments: left.metrics.comments ?? right.metrics.comments },
    placements: mergePlacements(left.placements, right.placements),
  };
}

function mergeTopicRecord(previous: TopicRecord | undefined, topic: CollectedTopic, collectedAt: string, wasPreviouslyCurrent: boolean, previousConsecutiveCount: number): TopicRecord {
  const placements = mergePlacements(previous?.placements ?? [], topic.placements);
  const snapshot: TopicMetricSnapshot = { observedAt: collectedAt, metrics: topic.metrics, placements };
  return {
    ...topic, placements,
    firstSeenAt: previous?.firstSeenAt ?? collectedAt,
    lastSeenAt: collectedAt,
    seenCount: (previous?.seenCount ?? 0) + 1,
    consecutiveCount: wasPreviouslyCurrent ? previousConsecutiveCount + 1 : 1,
    isCurrent: true,
    delta: metricDelta(previous?.metrics ?? null, topic.metrics),
    history: [...(previous?.history ?? []), snapshot].slice(-HISTORY_LIMIT),
  };
}

function mergePlacements(left: TopicPlacement[], right: TopicPlacement[]): TopicPlacement[] {
  const placements = new Map<string, TopicPlacement>();
  for (const placement of [...left, ...right]) placements.set(placement.collectorId, placement);
  return [...placements.values()].sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER));
}

function metricDelta(previous: TopicMetrics | null, current: TopicMetrics): TopicMetricDelta {
  return { likes: difference(previous?.likes ?? null, current.likes), comments: difference(previous?.comments ?? null, current.comments) };
}

function difference(previous: number | null, current: number | null): number | null {
  return previous === null || current === null ? null : current - previous;
}
