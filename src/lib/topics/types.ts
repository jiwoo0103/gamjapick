export const TOPIC_SOURCES = [
  "dcinside",
  "fmkorea",
  "theqoo",
  "reddit",
  "ndtv",
  "google-trends",
] as const;

export type TopicSource = (typeof TOPIC_SOURCES)[number];

export type TopicMetrics = {
  views: number | null;
  likes: number | null;
  comments: number | null;
  searchVolume: number | null;
};

export type CollectedTopic = {
  id: string;
  source: TopicSource;
  sourceId: string;
  url: string;
  title: string;
  titleOriginal: string | null;
  titleKo: string | null;
  publishedAt: string | null;
  publishedAtLabel: string | null;
  metrics: TopicMetrics;
  collectedAt: string;
};

export type CollectorSuccess = {
  source: TopicSource;
  status: "success";
  collectedAt: string;
  items: CollectedTopic[];
};

export type CollectorFailure = {
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

export type TopicDraft = Omit<CollectedTopic, "id" | "collectedAt" | "title" | "titleKo"> & {
  titleOriginal: string | null;
  title: string;
};
