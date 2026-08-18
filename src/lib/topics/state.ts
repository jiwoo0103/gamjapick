import type { CollectedTopic, CollectorResult, TopicMetricDelta, TopicMetricSnapshot, TopicMetrics, TopicRecord, TopicSource } from "./types";

const HISTORY_LIMIT = 48;
const RECENT_WINDOW_MS = 48 * 60 * 60 * 1_000;

export type MergedTopicState = {
  current: TopicRecord[];
  recent: TopicRecord[];
};

export function mergeTopicState(
  previousRecent: TopicRecord[],
  results: CollectorResult[],
  collectedAt: string,
): MergedTopicState {
  const successfulSources = new Set<TopicSource>();
  const collectedTopics = new Map<string, CollectedTopic>();

  for (const result of results) {
    if (result.status !== "success") continue;
    successfulSources.add(result.source);
    for (const topic of result.items) collectedTopics.set(topic.id, topic);
  }

  const records = new Map(previousRecent.map((record) => [record.id, record]));
  for (const [id, record] of records) {
    if (successfulSources.has(record.source) && !collectedTopics.has(id)) {
      records.set(id, { ...record, isCurrent: false, consecutiveCount: 0 });
    }
  }

  for (const topic of collectedTopics.values()) {
    records.set(topic.id, mergeTopicRecord(records.get(topic.id), topic, collectedAt));
  }

  const cutoff = new Date(collectedAt).getTime() - RECENT_WINDOW_MS;
  const recent = [...records.values()]
    .filter((record) => !isLegacyDcHitRecord(record))
    .filter((record) => Date.parse(record.lastSeenAt) >= cutoff)
    .sort((left, right) => Date.parse(right.lastSeenAt) - Date.parse(left.lastSeenAt));

  return { current: recent.filter((record) => record.isCurrent), recent };
}

function isLegacyDcHitRecord(record: TopicRecord): boolean {
  if (record.source !== "dcinside") return false;

  try {
    return new URL(record.url).searchParams.get("id") === "hit";
  } catch {
    return false;
  }
}

function mergeTopicRecord(previous: TopicRecord | undefined, topic: CollectedTopic, collectedAt: string): TopicRecord {
  const snapshot: TopicMetricSnapshot = { observedAt: collectedAt, metrics: topic.metrics };
  const history = [...(previous?.history ?? []), snapshot].slice(-HISTORY_LIMIT);

  return {
    ...topic,
    firstSeenAt: previous?.firstSeenAt ?? collectedAt,
    lastSeenAt: collectedAt,
    seenCount: (previous?.seenCount ?? 0) + 1,
    consecutiveCount: previous?.isCurrent ? previous.consecutiveCount + 1 : 1,
    isCurrent: true,
    delta: metricDelta(previous?.metrics ?? null, topic.metrics),
    history,
  };
}

function metricDelta(previous: TopicMetrics | null, current: TopicMetrics): TopicMetricDelta {
  return {
    views: difference(previous?.views ?? null, current.views),
    likes: difference(previous?.likes ?? null, current.likes),
    comments: difference(previous?.comments ?? null, current.comments),
    searchVolume: difference(previous?.searchVolume ?? null, current.searchVolume),
  };
}

function difference(previous: number | null, current: number | null): number | null {
  return previous === null || current === null ? null : current - previous;
}
