export const TOPIC_SOURCES = ["dogdrip", "donga", "hankyung", "khan", "mbc", "hackernews"] as const;

export type TopicSource = (typeof TOPIC_SOURCES)[number];

export type TopicMetrics = {
  likes: number | null;
  comments: number | null;
};

export type TopicPlacement = {
  /** Stable identifier for the independently collected curated list. */
  collectorId: string;
  label: string;
  rankingType: string;
  rank: number | null;
  category: string | null;
};

export type CollectedTopic = {
  id: string;
  source: TopicSource;
  sourceId: string;
  url: string;
  title: string;
  summary: string | null;
  publishedAt: string | null;
  publishedAtLabel: string | null;
  metrics: TopicMetrics;
  placements: TopicPlacement[];
  collectedAt: string;
};

export type CollectorSuccess = {
  collectorId: string;
  source: TopicSource;
  status: "success";
  collectedAt: string;
  items: CollectedTopic[];
};

export type CollectorFailure = {
  collectorId: string;
  source: TopicSource;
  status: "failed";
  collectedAt: string;
  error: string;
};

export type CollectorResult = CollectorSuccess | CollectorFailure;
export type TopicMetricDelta = TopicMetrics;

export type TopicMetricSnapshot = {
  observedAt: string;
  metrics: TopicMetrics;
  placements: TopicPlacement[];
};

export type TopicRecord = CollectedTopic & {
  firstSeenAt: string;
  lastSeenAt: string;
  seenCount: number;
  consecutiveCount: number;
  isCurrent: boolean;
  delta: TopicMetricDelta;
  history: TopicMetricSnapshot[];
};

export type TopicDraft = Omit<CollectedTopic, "id" | "collectedAt">;
