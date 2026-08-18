import type { CollectedTopic, CollectorFailure, CollectorResult, CollectorSuccess, TopicDraft, TopicSource } from "./types";
import { translateEnglishToKoreanBatch } from "./translate";

export type Collector = {
  source: TopicSource;
  collect: () => Promise<TopicDraft[]>;
};

function makeTopicId(source: TopicSource, sourceId: string): string {
  return `${source}:${sourceId}`;
}

async function finalizeTopics(drafts: TopicDraft[], collectedAt: string): Promise<CollectedTopic[]> {
  const originals = drafts.flatMap((draft) => draft.titleOriginal ? [draft.titleOriginal] : []);
  const translations = await translateEnglishToKoreanBatch(originals);
  let translationIndex = 0;

  return drafts.map((draft) => {
    const translation = draft.titleOriginal ? translations[translationIndex++] : null;
    return {
      ...draft,
      id: makeTopicId(draft.source, draft.sourceId),
      collectedAt,
      title: translation?.text ?? draft.title,
      titleKo: translation?.text ?? null,
    };
  });
}

export async function runCollector(collector: Collector): Promise<CollectorResult> {
  const collectedAt = new Date().toISOString();

  try {
    const drafts = await collector.collect();
    const items = await finalizeTopics(drafts, collectedAt);
    const success: CollectorSuccess = { source: collector.source, status: "success", collectedAt, items };
    return success;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown collector error";
    const failure: CollectorFailure = { source: collector.source, status: "failed", collectedAt, error: message };
    return failure;
  }
}

export function runCollectors(collectors: Collector[]): Promise<CollectorResult[]> {
  return Promise.all(collectors.map(runCollector));
}
