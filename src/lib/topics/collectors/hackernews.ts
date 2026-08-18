import type { Collector } from "../collector";
import { fetchPublicJson } from "../fetch";
import { cleanText } from "../parsers";
import type { TopicDraft } from "../types";

const BEST_STORIES_URL = "https://hacker-news.firebaseio.com/v0/beststories.json";
const STORY_LIMIT = 10;

export type HackerNewsStory = {
  id?: number;
  type?: string;
  title?: string;
  url?: string;
  score?: number;
  descendants?: number;
  time?: number;
};

export function parseHackerNewsStories(stories: HackerNewsStory[]): TopicDraft[] {
  return stories.slice(0, STORY_LIMIT).flatMap((story, index) => {
    const title = cleanText(story.title ?? "");
    const sourceId = story.id?.toString();
    if (story.type !== "story" || !title || !sourceId) return [];

    return [{
      source: "hackernews" as const,
      sourceId,
      url: story.url ?? `https://news.ycombinator.com/item?id=${sourceId}`,
      title,
      summary: null,
      publishedAt: typeof story.time === "number" ? new Date(story.time * 1_000).toISOString() : null,
      publishedAtLabel: null,
      metrics: { likes: typeof story.score === "number" ? story.score : null, comments: typeof story.descendants === "number" ? story.descendants : null },
      placements: [{ collectorId: "hackernews-best", label: "Hacker News Best Stories", rankingType: "Best Stories", rank: index + 1, category: "해외 · 기술/스타트업" }],
    }];
  });
}

async function collectHackerNewsBest(): Promise<TopicDraft[]> {
  const storyIds = await fetchPublicJson<unknown>(BEST_STORIES_URL);
  if (!Array.isArray(storyIds)) throw new Error("Hacker News best-stories response did not contain an ID list.");

  const stories = await Promise.all(storyIds.slice(0, STORY_LIMIT).map(async (storyId) => {
    if (typeof storyId !== "number") return {};
    return fetchPublicJson<HackerNewsStory>(`https://hacker-news.firebaseio.com/v0/item/${storyId}.json`);
  }));
  return parseHackerNewsStories(stories);
}

export const hackerNewsCollectors: Collector[] = [{ id: "hackernews-best", source: "hackernews", collect: collectHackerNewsBest }];
