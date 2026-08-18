import type { TopicRecord, TopicSource } from "./types";

export const SOURCE_LABELS: Record<TopicSource, string> = {
  dcinside: "DCInside",
  fmkorea: "FMKorea",
  theqoo: "TheQoo",
  reddit: "Reddit",
  ndtv: "NDTV",
  "google-trends": "Google Trends",
};

export const SOURCE_ACCENTS: Record<TopicSource, string> = {
  dcinside: "bg-sky-100 text-sky-800",
  fmkorea: "bg-rose-100 text-rose-800",
  theqoo: "bg-violet-100 text-violet-800",
  reddit: "bg-orange-100 text-orange-800",
  ndtv: "bg-emerald-100 text-emerald-800",
  "google-trends": "bg-amber-100 text-amber-800",
};

export type SourceFilter = "all" | TopicSource;
export type TopicSort = "recent" | "consecutive" | "views" | "likes" | "comments";

export function filterAndSortTopics(
  topics: TopicRecord[],
  source: SourceFilter,
  sort: TopicSort,
): TopicRecord[] {
  return topics
    .filter((topic) => source === "all" || topic.source === source)
    .slice()
    .sort((left, right) => compareTopics(left, right, sort));
}

function compareTopics(left: TopicRecord, right: TopicRecord, sort: TopicSort): number {
  if (sort === "recent") return compareDates(right.lastSeenAt, left.lastSeenAt);
  if (sort === "consecutive") return compareNumbers(right.consecutiveCount, left.consecutiveCount, left, right);

  const metric = sort === "views" ? "views" : sort === "likes" ? "likes" : "comments";
  return compareNumbers(right.delta[metric], left.delta[metric], left, right);
}

function compareNumbers(
  left: number | null,
  right: number | null,
  leftTopic: TopicRecord,
  rightTopic: TopicRecord,
): number {
  const leftValue = left ?? Number.NEGATIVE_INFINITY;
  const rightValue = right ?? Number.NEGATIVE_INFINITY;
  if (leftValue !== rightValue) return leftValue - rightValue;

  return compareDates(rightTopic.lastSeenAt, leftTopic.lastSeenAt);
}

function compareDates(left: string, right: string): number {
  return Date.parse(left) - Date.parse(right);
}
