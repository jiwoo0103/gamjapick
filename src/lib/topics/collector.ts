import type { CollectedTopic, CollectorFailure, CollectorResult, CollectorSuccess, TopicDraft, TopicSource } from "./types";

export type Collector = {
  id: string;
  source: TopicSource;
  collect: () => Promise<TopicDraft[]>;
};

function makeTopicId(source: TopicSource, sourceId: string): string {
  return `${source}:${sourceId}`;
}

export function finalizeTopics(drafts: TopicDraft[], collectedAt: string): CollectedTopic[] {
  return drafts.map((draft) => ({ ...draft, id: makeTopicId(draft.source, draft.sourceId), collectedAt }));
}

export async function runCollector(collector: Collector): Promise<CollectorResult> {
  const collectedAt = new Date().toISOString();
  try {
    const items = finalizeTopics(await collector.collect(), collectedAt);
    const success: CollectorSuccess = { collectorId: collector.id, source: collector.source, status: "success", collectedAt, items };
    return success;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown collector error";
    const failure: CollectorFailure = { collectorId: collector.id, source: collector.source, status: "failed", collectedAt, error: message };
    return failure;
  }
}

export function runCollectors(collectors: Collector[]): Promise<CollectorResult[]> {
  return Promise.all(collectors.map(runCollector));
}
