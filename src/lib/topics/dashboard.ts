import type { TopicRecord, TopicSource } from "./types";

export const SOURCE_LABELS: Record<TopicSource, string> = { dogdrip: "Dogdrip", donga: "동아일보", hankyung: "한국경제", khan: "경향신문", mbc: "MBC 뉴스", hackernews: "Hacker News" };
export const SOURCE_ACCENTS: Record<TopicSource, string> = { dogdrip: "bg-lime-100 text-lime-900", donga: "bg-sky-100 text-sky-800", hankyung: "bg-emerald-100 text-emerald-800", khan: "bg-violet-100 text-violet-800", mbc: "bg-rose-100 text-rose-800", hackernews: "bg-orange-100 text-orange-800" };
export type SourceFilter = "all" | TopicSource;
export type TopicRegion = "all" | "domestic" | "overseas";
export type TopicSort = "recent" | "consecutive" | "rank" | "likes" | "comments";

export const SOURCE_REGIONS: Record<TopicSource, Exclude<TopicRegion, "all">> = {
  dogdrip: "domestic",
  donga: "domestic",
  hankyung: "domestic",
  khan: "domestic",
  mbc: "domestic",
  hackernews: "overseas",
};

export function bestRank(topic: TopicRecord): number | null {
  const ranks = topic.placements.flatMap((placement) => placement.rank === null ? [] : [placement.rank]);
  return ranks.length ? Math.min(...ranks) : null;
}

export function filterAndSortTopics(topics: TopicRecord[], source: SourceFilter, sort: TopicSort, region: TopicRegion = "all"): TopicRecord[] {
  return topics.filter((topic) => (source === "all" || topic.source === source) && (region === "all" || SOURCE_REGIONS[topic.source] === region)).slice().sort((left, right) => compareTopics(left, right, sort));
}

function compareTopics(left: TopicRecord, right: TopicRecord, sort: TopicSort): number {
  if (sort === "recent") return compareDates(right.lastSeenAt, left.lastSeenAt);
  if (sort === "consecutive") return compareNumbers(right.consecutiveCount, left.consecutiveCount, left, right);
  if (sort === "rank") return compareRank(bestRank(left), bestRank(right), left, right);
  const metric = sort === "likes" ? "likes" : "comments";
  return compareNumbers(right.delta[metric], left.delta[metric], left, right);
}

function compareRank(left: number | null, right: number | null, leftTopic: TopicRecord, rightTopic: TopicRecord) {
  const leftValue = left ?? Number.POSITIVE_INFINITY; const rightValue = right ?? Number.POSITIVE_INFINITY;
  return leftValue !== rightValue ? leftValue - rightValue : compareDates(rightTopic.lastSeenAt, leftTopic.lastSeenAt);
}
function compareNumbers(left: number | null, right: number | null, leftTopic: TopicRecord, rightTopic: TopicRecord) {
  const leftValue = left ?? Number.NEGATIVE_INFINITY; const rightValue = right ?? Number.NEGATIVE_INFINITY;
  return leftValue !== rightValue ? leftValue - rightValue : compareDates(rightTopic.lastSeenAt, leftTopic.lastSeenAt);
}
function compareDates(left: string, right: string): number { return Date.parse(left) - Date.parse(right); }
